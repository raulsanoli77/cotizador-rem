-- ============================================
-- Seed: Categorías iniciales
-- ============================================

INSERT INTO categorias (nombre, slug, campos_filtro, descripcion) VALUES
(
  'Endmills',
  'endmills',
  '[
    {"nombre": "Diametro", "tipo": "rango", "unidad": "mm"},
    {"nombre": "Zanco", "tipo": "rango", "unidad": "mm"},
    {"nombre": "Flautas", "tipo": "seleccion", "opciones": ["2", "3", "4", "5", "6"]},
    {"nombre": "Recubrimiento", "tipo": "seleccion", "opciones": ["TiAlN", "AlTiN", "TiN", "Sin recubrimiento", "DLC", "nACo"]},
    {"nombre": "Material", "tipo": "seleccion", "opciones": ["Carburo sólido", "HSS", "HSS-Co", "Carburo micrograno"]},
    {"nombre": "Longitud_Total", "tipo": "rango", "unidad": "mm"}
  ]'::jsonb,
  'Fresas de extremo para maquinado CNC'
),
(
  'Insertos',
  'insertos',
  '[
    {"nombre": "Clasificacion", "tipo": "seleccion", "opciones": ["Carburo", "Cerámicos", "CBN", "PCD", "Cermet"]},
    {"nombre": "Geometria", "tipo": "seleccion", "opciones": ["CNMG", "WNMG", "DNMG", "TNMG", "SNMG", "VNMG", "CCMT", "DCMT", "TCMT", "VCMT"]},
    {"nombre": "Radio", "tipo": "rango", "unidad": "mm"},
    {"nombre": "Grado", "tipo": "texto"},
    {"nombre": "Recubrimiento", "tipo": "seleccion", "opciones": ["CVD", "PVD", "Sin recubrimiento"]}
  ]'::jsonb,
  'Insertos intercambiables para torneado y fresado'
),
(
  'Brocas',
  'brocas',
  '[
    {"nombre": "Diametro", "tipo": "rango", "unidad": "mm"},
    {"nombre": "Profundidad_Corte", "tipo": "rango", "unidad": "xD"},
    {"nombre": "Tipo", "tipo": "seleccion", "opciones": ["Helicoidal", "Con insertos", "De centro", "Escalonada", "Cañón"]},
    {"nombre": "Refrigerante_Interno", "tipo": "seleccion", "opciones": ["Sí", "No"]}
  ]'::jsonb,
  'Brocas para taladrado en CNC y convencional'
),
(
  'Portaherramientas',
  'portaherramientas',
  '[
    {"nombre": "Tipo_Cono", "tipo": "seleccion", "opciones": ["BT30", "BT40", "BT50", "CAT40", "CAT50", "HSK-A63", "HSK-A100", "R8", "MT2", "MT3", "MT4"]},
    {"nombre": "Tipo_Sujecion", "tipo": "seleccion", "opciones": ["ER", "Hidráulico", "Shrink Fit", "Weldon", "Power Chuck"]},
    {"nombre": "Diametro_Pinza", "tipo": "rango", "unidad": "mm"}
  ]'::jsonb,
  'Portaherramientas y conos para centros de maquinado'
),
(
  'Medición',
  'medicion',
  '[
    {"nombre": "Tipo_Instrumento", "tipo": "seleccion", "opciones": ["Micrómetro", "Calibrador Vernier", "Indicador de Carátula", "Comparador", "Galgas", "Rugosímetro"]},
    {"nombre": "Rango", "tipo": "texto"},
    {"nombre": "Resolucion", "tipo": "texto"},
    {"nombre": "Digital", "tipo": "seleccion", "opciones": ["Sí", "No"]}
  ]'::jsonb,
  'Instrumentos de medición y verificación dimensional'
);
