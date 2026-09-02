# Plan de Implementación: Gestor de Categorías y Atributos

## 1. Metodología Recomendada (Arquitectura NoSQL-híbrida)
Actualmente, el sistema guarda las reglas de qué campos lleva cada categoría en un formato JSON dentro de la base de datos (por eso "Endmills" sabe que debe pedir "Flautas", pero "Medición" no). 

**Mantener esta estructura es la mejor metodología**, porque te permite infinita flexibilidad (una broca tiene especificaciones totalmente distintas a un inserto). Lo único que falta es una **interfaz gráfica** para que tú puedas editar ese JSON sin ser programador.

## 2. Nueva Pantalla: Gestor de Categorías (`/admin/categorias`)
Crearé una pantalla completamente nueva en tu menú de administrador. En ella podrás:
1. **Crear Categorías:** Agregar "Machuelos", "Sierras", etc.
2. **Crear/Editar Campos:** Decidir qué campos pide cada categoría (ej. "Diámetro", "Longitud").
3. **Gestor de Listas (Dropdowns):** Si un campo es de opción múltiple (ej. "Recubrimiento" o "Flautas"), tendrás una cajita donde podrás escribir todas las opciones separadas por coma (ej. `TiAlN, AlTiN, Diamante, Zirconio`). Así podrás agregar o quitar opciones de tus menús desplegables en segundos.

## 3. Resolución del Problema de Excel (Plantillas Dinámicas)
Es una excelente observación. Si agregas una nueva categoría (ej. Machuelos) con nuevos campos (ej. "Paso de Rosca"), el Excel genérico ya no sirve.
**La solución:** 
En la pantalla de "Carga Masiva", agregaré un botón llamado **"Descargar Plantilla por Categoría"**. 
Al seleccionarla, el sistema leerá la configuración en tiempo real de tu base de datos y te generará un archivo Excel `.csv` con las columnas exactas que necesitas (incluyendo los nuevos campos que hayas inventado). Así, tu Excel siempre estará 100% sincronizado con tu plataforma.

> [!IMPORTANT]
> **Impacto Cero:** Construir este módulo no afectará los productos que ya diste de alta ni la forma en que funciona el cotizador. Solo habilitará la pantalla de configuración para controlar los selectores.

¿Te parece bien este plan? Si lo apruebas, comienzo a construir la pantalla del "Gestor de Categorías" de inmediato.
