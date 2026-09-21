-- ==============================================================================
-- ESQUEMA Y RPC ATÓMICA PARA SUPABASE: BABY SHOWER ("UN JEFE EN PAÑALES")
-- URL del Proyecto: https://nbdttpplnlxmnsgatslk.supabase.co
-- ==============================================================================

-- 1. Tabla: Regalos
CREATE TABLE IF NOT EXISTS public.regalos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    cupo_total INT NOT NULL DEFAULT 1 CHECK (cupo_total >= 0),
    cupo_disponible INT NOT NULL DEFAULT 1 CHECK (cupo_disponible >= 0),
    permite_regiro BOOLEAN NOT NULL DEFAULT FALSE,
    es_mayor BOOLEAN NOT NULL DEFAULT FALSE,
    icono VARCHAR(50) DEFAULT 'gift',
    color VARCHAR(20) DEFAULT '#0A2540',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Asegurar columna permite_regiro si la tabla ya existía previamente
ALTER TABLE public.regalos ADD COLUMN IF NOT EXISTS permite_regiro BOOLEAN DEFAULT FALSE;

-- 2. Tabla: Invitados
CREATE TABLE IF NOT EXISTS public.invitados (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    regalo_id INT NOT NULL REFERENCES public.regalos(id) ON DELETE RESTRICT,
    fecha TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_registro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_invitado_nombre UNIQUE (nombre)
);

-- Índices para optimización de consultas
CREATE INDEX IF NOT EXISTS idx_regalos_cupo ON public.regalos(cupo_disponible);
CREATE INDEX IF NOT EXISTS idx_invitados_nombre_lower ON public.invitados (LOWER(nombre));

-- 3. Semilla Oficial de Datos: Los 12 Regalos Oficiales (40 Cupos Totales)
-- Para reiniciar o actualizar limpiamente los regalos:
TRUNCATE TABLE public.invitados CASCADE;
DELETE FROM public.regalos;

INSERT INTO public.regalos (id, nombre, cupo_total, cupo_disponible, permite_regiro, es_mayor, icono, color)
VALUES
    (1,  'Cuna o Corral',                                      1, 1, TRUE,  TRUE,  'bed',      '#0A2540'),
    (2,  'Coche para bebé',                                    1, 1, TRUE,  TRUE,  'stroller', '#1A365D'),
    (3,  'Canguro o Portabebé ergonómico',                     1, 1, TRUE,  TRUE,  'award',    '#D4AF37'),
    (4,  'Pañales Recién Nacido + Pañitos',                    6, 6, FALSE, FALSE, 'package',  '#2563EB'),
    (5,  'Pañales Etapa 1 + Pañitos',                          6, 6, FALSE, FALSE, 'package',  '#3B82F6'),
    (6,  'Bodies y Pijamas (0 a 3 meses)',                     5, 5, FALSE, FALSE, 'shirt',    '#1D4ED8'),
    (7,  'Conjuntos de Salida y Ropita (3 a 6 meses)',         4, 4, FALSE, FALSE, 'tag',      '#0284C7'),
    (8,  'Baño e Higiene (Shampoo + Jabón + Crema)',           4, 4, FALSE, FALSE, 'droplet',  '#0EA5E9'),
    (9,  'Alimentación (Biberón + Cepillo + Baberos)',         4, 4, FALSE, FALSE, 'coffee',   '#38BDF8'),
    (10, 'Higiene y Salud (Termómetro + Cortaúñas + Aspirador)', 3, 3, FALSE, FALSE, 'activity', '#06B6D4'),
    (11, 'Cuidado y Sueño (Mantas térmicas + Sábanas)',         3, 3, FALSE, FALSE, 'moon',     '#6366F1'),
    (12, 'Accesorios y Organización (Cojín / Organizador pañales)', 2, 2, FALSE, FALSE, 'box',  '#8B5CF6')
ON CONFLICT (id) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    cupo_total = EXCLUDED.cupo_total,
    cupo_disponible = EXCLUDED.cupo_disponible,
    permite_regiro = EXCLUDED.permite_regiro,
    es_mayor = EXCLUDED.es_mayor,
    icono = EXCLUDED.icono,
    color = EXCLUDED.color;

-- Sincronizar secuencia de IDs
SELECT setval('public.regalos_id_seq', COALESCE((SELECT MAX(id) FROM public.regalos), 1));

-- 4. RPC Transaccional Atómica: reclamar_regalo
-- Maneja concurrencia bloqueando la fila de regalo mediante FOR UPDATE
-- y asegurando que no se exceda el cupo_disponible bajo ninguna circunstancia.
CREATE OR REPLACE FUNCTION public.reclamar_regalo(
    p_nombre TEXT,
    p_regalo_id INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_nombre_limpio TEXT;
    v_regalo RECORD;
    v_invitado_id INT;
BEGIN
    -- Limpieza y validación de entrada
    v_nombre_limpio := TRIM(REGEXP_REPLACE(p_nombre, '\s+', ' ', 'g'));
    
    IF v_nombre_limpio IS NULL OR v_nombre_limpio = '' THEN
        RAISE EXCEPTION 'El nombre del invitado no puede estar vacío.'
            USING ERRCODE = '22000';
    END IF;

    -- Validar si el invitado ya ha reclamado un regalo previamente (búsqueda insensible a mayúsculas)
    IF EXISTS (
        SELECT 1 FROM public.invitados 
        WHERE LOWER(nombre) = LOWER(v_nombre_limpio)
    ) THEN
        RAISE EXCEPTION 'El invitado "%" ya ha reclamado un regalo anteriormente.', v_nombre_limpio
            USING ERRCODE = '23505';
    END IF;

    -- Bloqueo atómico de la fila del regalo para evitar condiciones de carrera (Race Conditions)
    SELECT * INTO v_regalo
    FROM public.regalos
    WHERE id = p_regalo_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'El regalo con ID % no existe.', p_regalo_id
            USING ERRCODE = '02000';
    END IF;

    -- Comprobación estricta de cupo
    IF v_regalo.cupo_disponible <= 0 THEN
        RAISE EXCEPTION 'El cupo para el regalo "%" se ha agotado.', v_regalo.nombre
            USING ERRCODE = '20001';
    END IF;

    -- Decrementar cupo atómicamente
    UPDATE public.regalos
    SET cupo_disponible = cupo_disponible - 1
    WHERE id = p_regalo_id;

    -- Registrar al invitado ganador
    INSERT INTO public.invitados (nombre, regalo_id, fecha, fecha_registro)
    VALUES (v_nombre_limpio, p_regalo_id, NOW(), NOW())
    RETURNING id INTO v_invitado_id;

    -- Retornar información completa de la transacción exitosa
    RETURN jsonb_build_object(
        'success', TRUE,
        'mensaje', 'Regalo asignado con éxito.',
        'invitado_id', v_invitado_id,
        'invitado_nombre', v_nombre_limpio,
        'regalo_id', p_regalo_id,
        'regalo_nombre', v_regalo.nombre,
        'cupo_restante', v_regalo.cupo_disponible - 1
    );
END;
$$;

-- 5. Configuración de Seguridad (RLS - Row Level Security)
ALTER TABLE public.regalos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitados ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura pública con Anon Key
DROP POLICY IF EXISTS "Lectura pública de regalos" ON public.regalos;
CREATE POLICY "Lectura pública de regalos" 
ON public.regalos FOR SELECT 
TO anon, authenticated 
USING (true);

DROP POLICY IF EXISTS "Lectura pública de invitados" ON public.invitados;
CREATE POLICY "Lectura pública de invitados" 
ON public.invitados FOR SELECT 
TO anon, authenticated 
USING (true);

-- Otorgar permisos de ejecución de la RPC y lectura de tablas
GRANT EXECUTE ON FUNCTION public.reclamar_regalo(TEXT, INT) TO anon, authenticated;
GRANT SELECT ON TABLE public.regalos TO anon, authenticated;
GRANT SELECT ON TABLE public.invitados TO anon, authenticated;
