"""Contenido de cada página de la documentación de arquitectura."""
from __future__ import annotations
from helpers import mermaid, table, callout, code, section

# ===========================================================================
# INICIO
# ===========================================================================
_module_cards = """
<div class="cards">
  <a class="card" href="vision-general.html"><b>Visión general</b><span>Capas, flujo de datos y principios de ingeniería.</span></a>
  <a class="card" href="navegacion.html"><b>Navegación y roles</b><span>Árbol de navegación público / dueño / staff.</span></a>
  <a class="card" href="sesion-autenticacion.html"><b>Sesión y autenticación</b><span>Bearer, refresh y almacenamiento seguro.</span></a>
  <a class="card" href="capa-http.html"><b>Capa HTTP</b><span>Cliente <code>api</code>, errores y reintentos.</span></a>
  <a class="card" href="configuracion-servidor.html"><b>Configuración de servidor</b><span>Self-hosted: elige tu backend.</span></a>
  <a class="card" href="servicios-dominio.html"><b>Servicios de dominio</b><span>Un servicio por dominio contra el backend real.</span></a>
  <a class="card" href="pantallas-publico.html"><b>Área pública</b><span>Tienda, adopción, patrocinios, contacto.</span></a>
  <a class="card" href="pantallas-owner.html"><b>Área del dueño</b><span>Mascotas, citas, historial médico, perfil.</span></a>
  <a class="card" href="pantallas-admin.html"><b>Área del staff</b><span>Pacientes, agenda, módulos clínicos.</span></a>
  <a class="card" href="componentes-ui.html"><b>Componentes y tema</b><span>UI, dominio, layout y modo oscuro.</span></a>
  <a class="card" href="estado-datos.html"><b>Estado, datos y hooks</b><span><code>useAsync</code>, tipos y utilidades.</span></a>
  <a class="card" href="local-first.html"><b>Local-first</b><span>SQLite local y sincronización diferida.</span></a>
  <a class="card" href="testing.html"><b>Testing y calidad</b><span>Integración real, sin mocks.</span></a>
</div>
"""

INDEX = (
    section(
        "que-es",
        "¿Qué es Pawcare Mobile?",
        "<p>Aplicación móvil <b>Android</b> (Expo / React Native) para una clínica "
        "veterinaria a domicilio. Sirve a tres audiencias desde una sola app: el "
        "<b>público</b> (sin sesión), el <b>dueño</b> de mascotas y el <b>staff</b> "
        "clínico. Toda pantalla consume <b>datos reales</b> del backend Rails "
        "<code>pawcare</code> a través de su servicio de dominio — sin datos "
        "mockeados.</p>",
        '<div class="pills">'
        '<span class="pill">Expo SDK 56</span><span class="pill">React Native 0.85</span>'
        '<span class="pill">React 19</span><span class="pill">TypeScript estricto</span>'
        '<span class="pill">React Navigation</span><span class="pill">expo-sqlite</span>'
        '<span class="pill">Jest (integración real)</span></div>',
    )
    + section(
        "mapa",
        "Mapa de la documentación",
        "<p>Cada módulo tiene su propia página autocontenida. Los diagramas se "
        "<b>amplían al hacer click</b> (arrastra para mover, rueda para zoom).</p>",
        _module_cards,
    )
    + section(
        "arquitectura",
        "Arquitectura en una imagen",
        mermaid(
            """
            flowchart TB
              subgraph APP["App móvil (Expo / RN)"]
                UI["Pantallas por rol<br/>(público · dueño · staff)"]
                NAV["Navegación<br/>RootNavigator + stacks"]
                COMP["Componentes<br/>ui · domain · layout"]
                SVC["Servicios de dominio<br/>src/services/*"]
                API["Cliente HTTP<br/>src/services/api.ts"]
                SESS["Sesión<br/>SessionProvider + SecureStore"]
                CFG["Config de servidor<br/>serverConfig"]
                DB[("SQLite local<br/>expo-sqlite (local-first)")]
              end
              BE["Backend Rails<br/>pawcare (JSON + Bearer)"]

              UI --> NAV
              UI --> COMP
              UI --> SVC
              SVC --> API
              SESS --> API
              CFG --> API
              API -->|"HTTPS / Bearer"| BE
              SVC -.->|"F3+ (roadmap)"| DB
              DB -.->|"sync diferida"| API
            """
        ),
    )
    + section(
        "instalacion",
        "Instalación rápida",
        callout(
            "info",
            "Requisitos: <b>Node ≥ 20</b>, <b>Yarn 4</b> (Corepack), y para Android un "
            "<b>emulador</b> o dispositivo con <b>Expo Go</b>. El backend "
            "<code>pawcare</code> debe estar corriendo (por defecto en "
            "<code>http://localhost:3000</code>).",
        ),
        code(
            """
            # 1) Dependencias
            corepack enable
            yarn install

            # 2) Backend en marcha (repo ../open-chepicare-web) en el puerto 3000
            #    El emulador Android lo alcanza vía http://10.0.2.2:3000 (default de dev).

            # 3) Arrancar Metro / Expo
            yarn start           # luego abre en Expo Go o el dev client

            # 4) Compuertas de calidad
            yarn typecheck
            yarn lint
            yarn test            # tests de INTEGRACIÓN reales contra localhost:3000
            """
        ),
        "<p>La URL del backend se puede cambiar <b>en tiempo de ejecución</b> desde la "
        "pantalla <em>Configurar servidor</em> (ver "
        '<a href="configuracion-servidor.html">Configuración de servidor</a>), sin '
        "recompilar.</p>",
    )
    + section(
        "dependencias",
        "Dependencias principales",
        table(
            ["Paquete", "Rol"],
            [
                ["<code>expo</code> ~56", "Runtime, módulos nativos y config plugins."],
                ["<code>react-native</code> 0.85", "Framework de UI nativa."],
                ["<code>@react-navigation/*</code>", "Navegación por stacks y tabs."],
                ["<code>expo-secure-store</code>", "Tokens de sesión cifrados."],
                ["<code>@react-native-async-storage/async-storage</code>", "Preferencias (tema, URL de servidor)."],
                ["<code>expo-sqlite</code>", "Base de datos local (local-first)."],
                ["<code>expo-image-picker</code>", "Comprobante de pago en checkout."],
                ["<code>undici</code> (dev)", "Fetch real en los tests de Node."],
                ["<code>jest-expo</code> + RNTL (dev)", "Tests de integración y de componentes."],
            ],
        ),
    )
)

# ===========================================================================
# VISIÓN GENERAL
# ===========================================================================
VISION = (
    section(
        "capas",
        "Capas y responsabilidades",
        "<p>La app separa con claridad la <b>presentación</b>, la <b>lógica de "
        "dominio</b> y el <b>transporte</b>. Las pantallas nunca hablan HTTP "
        "directamente: siempre pasan por un servicio de dominio.</p>",
        mermaid(
            """
            flowchart TD
              A["Pantallas (screens/*)<br/>estados carga/error/vacío"]
              B["Componentes reutilizables<br/>ui · domain · layout"]
              C["Hooks<br/>useAsync · useAuth · useTheme"]
              D["Servicios de dominio<br/>services/*.ts"]
              E["Cliente HTTP<br/>api.ts (ApiError, refresh)"]
              F["Config + Sesión<br/>serverConfig · SessionProvider"]
              G["Backend Rails pawcare"]
              A --> B
              A --> C
              C --> D
              A --> D
              D --> E
              F --> E
              E --> G
            """
        ),
    )
    + section(
        "flujo",
        "Flujo de una pantalla con datos",
        "<p>Patrón único en toda la app: un hook <code>useAsync</code> ejecuta el "
        "servicio y un componente <code>AsyncBoundary</code> resuelve los estados de "
        "<b>carga</b>, <b>error</b> (con reintento) y <b>vacío</b>.</p>",
        mermaid(
            """
            sequenceDiagram
              participant P as Pantalla
              participant H as useAsync
              participant S as Servicio de dominio
              participant A as api.ts
              participant B as Backend
              P->>H: useAsync(() => listXxx())
              H->>S: ejecuta fn
              S->>A: api.get('/ruta')
              A->>B: GET + Authorization Bearer
              B-->>A: JSON
              A-->>S: datos tipados
              S-->>H: resultado
              H-->>P: {data, loading, error, reload}
              Note over P: AsyncBoundary muestra<br/>carga / error / vacío / contenido
            """
        ),
    )
    + section(
        "principios",
        "Principios de ingeniería (obligatorios)",
        table(
            ["Principio", "Qué significa"],
            [
                ["Todo real, nada mockeado", "Cada pantalla usa datos reales del backend a través de su servicio."],
                ["TDD en lógica de negocio", "Hooks, servicios y utilidades se escriben con test primero; los tests son de integración real."],
                ["Estados explícitos", "Carga, error y vacío en toda pantalla que pide datos."],
                ["TypeScript estricto", "Sin <code>any</code> salvo justificación; tipos en <code>src/types</code>."],
                ["Compuertas por commit", "<code>test</code> + <code>typecheck</code> + <code>lint</code> + react-doctor + <code>format</code>."],
                ["Self-hosted", "La URL del backend es configurable en runtime (open source)."],
            ],
        ),
        callout(
            "tip",
            "Estas reglas viven en <code>AGENTS.md</code> en la raíz del repo y son "
            "la fuente de verdad del estilo del proyecto.",
        ),
    )
    + section(
        "estructura",
        "Estructura de carpetas",
        code(
            """
            src/
              components/   ui · domain · layout   (presentación reutilizable)
              config/       env · serverConfig      (entorno y servidor runtime)
              db/           SQLite local + migraciones (local-first)
              hooks/        useAsync · useAuth · useTheme
              navigation/   RootNavigator + stacks por rol
              screens/      public · owner · admin · auth
              services/     un archivo por dominio + api.ts (cliente HTTP)
              session/      SessionProvider (estado de sesión)
              theme/        ThemeProvider + tokens + ciclo de tema
              types/        models.ts · api.ts
              utils/        format · schedule · secureStore
            """
        ),
    )
)

# ===========================================================================
# NAVEGACIÓN Y ROLES
# ===========================================================================
NAVEGACION = (
    section(
        "root",
        "RootNavigator: un árbol por rol",
        "<p>Al arrancar, <code>SessionProvider</code> intenta restaurar la sesión. "
        "Mientras tanto <code>RootNavigator</code> muestra una pantalla de carga; "
        "luego elige el árbol según el <b>rol</b>: sin sesión → público; "
        "<code>owner</code> → pestañas del dueño; <code>admin</code> → pestañas del "
        "staff.</p>",
        mermaid(
            """
            flowchart TD
              R["RootNavigator"] --> S{"estado de sesión"}
              S -->|"restoring"| L["Splash / cargando"]
              S -->|"ready"| Rol{"rol"}
              Rol -->|"sin sesión"| PUB["PublicStack"]
              Rol -->|"owner"| OWN["OwnerTabs"]
              Rol -->|"admin"| ADM["AdminTabs"]
              PUB --> AUTH["AuthStack<br/>(login / registro / servidor)"]
            """
        ),
    )
    + section(
        "publico",
        "Árbol público (sin sesión)",
        mermaid(
            """
            flowchart LR
              PL["PublicLanding"] --> SRV["Services"]
              PL --> PROD["Products"] --> PD["ProductDetail"] --> CHK["Checkout"] --> UP["UploadProof"]
              PL --> ADO["AdoptionLanding"] --> AL["AdoptionList"] --> AD["AdoptionDetail"]
              PL --> SP["SponsorshipsList"] --> SD["SponsorshipDetail"]
              PL --> CON["Contact"]
              PL --> AU["Auth (Welcome)"]
              AU --> LOG["Login"]
              AU --> REG["Register"]
              AU --> FP["ForgotPassword"]
              AU --> SS["ServerSettings"]
            """
        ),
    )
    + section(
        "roles-tabs",
        "Pestañas por rol",
        "<p>Owner y staff usan <b>bottom tabs</b>, cada pestaña con su propio stack.</p>",
        mermaid(
            """
            flowchart TB
              subgraph OWN["OwnerTabs"]
                O1["Inicio"] --- O2["Mascotas"] --- O3["Citas"] --- O4["Perfil"]
              end
              subgraph ADM["AdminTabs"]
                A1["Inicio"] --- A2["Pacientes"] --- A3["Agenda"] --- A4["Más"]
              end
            """
        ),
        table(
            ["Stack", "Contiene"],
            [
                ["OwnerTabs", "Dashboard, mascotas (+detalle, formularios, médico), citas (+wizard), perfil (editar, contraseña, tema, cerrar sesión)."],
                ["AdminTabs", "Dashboard de métricas, pacientes, agenda (+wizard), módulos clínicos, ajustes (tema, servidor, cerrar sesión)."],
                ["PublicStack", "Landing + secciones abiertas + AuthStack anidado."],
            ],
        ),
        callout(
            "info",
            "El cambio de árbol es automático: al iniciar o cerrar sesión cambia el "
            "<code>role</code> en la sesión y <code>RootNavigator</code> remonta el "
            "árbol correspondiente.",
        ),
    )
)

# ===========================================================================
# SESIÓN Y AUTENTICACIÓN
# ===========================================================================
SESION = (
    section(
        "modelo",
        "Autenticación por Bearer (separada de la web)",
        "<p>La app móvil se autentica contra rutas dedicadas <code>/auth/mobile/*</code>, "
        "independientes del flujo web por cookies. El backend devuelve un "
        "<code>access_token</code> y un <code>refresh_token</code> que se guardan "
        "cifrados con <code>expo-secure-store</code>.</p>",
        table(
            ["Ruta", "Uso"],
            [
                ["<code>POST /auth/mobile/login</code>", "Inicia sesión (login + password) → tokens + usuario."],
                ["<code>POST /auth/mobile/register</code>", "Registro de dueño → tokens + usuario."],
                ["<code>GET /auth/mobile/me</code>", "Restaura la sesión al arrancar."],
                ["<code>POST /auth/mobile/refresh</code>", "Renueva el access token ante un 401."],
                ["<code>POST /auth/mobile/logout</code>", "Revoca el refresh token."],
            ],
        ),
    )
    + section(
        "provider",
        "SessionProvider y useAuth",
        "<p><code>SessionProvider</code> mantiene el <b>usuario</b>, el <b>rol</b> y el "
        "<b>estado</b> (<code>restoring</code> / <code>ready</code>). Expone acciones "
        "vía <code>useAuth</code>: <code>signIn</code>, <code>register</code>, "
        "<code>signOut</code> y <code>refreshUser</code>. También registra en el "
        "cliente HTTP cómo obtener el token y cómo refrescar la sesión.</p>",
        mermaid(
            """
            sequenceDiagram
              participant U as Usuario
              participant L as LoginScreen
              participant Se as SessionProvider
              participant Au as services/auth
              participant St as SecureStore
              participant B as Backend
              U->>L: login + contraseña
              L->>Se: signIn()
              Se->>Au: login()
              Au->>B: POST /auth/mobile/login
              B-->>Au: access + refresh + user
              Au->>St: guarda tokens (cifrados)
              Au-->>Se: user
              Se->>Se: role = owner | admin
              Note over Se: RootNavigator remonta<br/>el árbol del rol
            """
        ),
    )
    + section(
        "refresh",
        "Refresh transparente",
        "<p>Cuando una petición autenticada recibe <b>401</b>, el cliente intenta un "
        "<code>refresh</code> <b>una sola vez</b> y reintenta la petición original. Si "
        "el refresh falla, se limpia la sesión y la app vuelve al árbol público.</p>",
        callout(
            "ok",
            "Los tokens nunca se registran en logs ni se exponen en mensajes de error "
            "(ver <a href=\"capa-http.html\">Capa HTTP</a>).",
        ),
    )
)

# ===========================================================================
# CAPA HTTP
# ===========================================================================
CAPA_HTTP = (
    section(
        "cliente",
        "El cliente api",
        "<p><code>src/services/api.ts</code> centraliza todo el HTTP. Expone "
        "<code>api.get/post/patch/put/delete</code>, más <code>upload</code> "
        "(multipart) y <code>raw</code> (respuestas binarias). Cada servicio de "
        "dominio se apoya en él; ninguna pantalla llama a <code>fetch</code> "
        "directamente.</p>",
        table(
            ["Responsabilidad", "Detalle"],
            [
                ["Base URL en runtime", "Toma <code>getApiBaseUrl()</code> de <code>serverConfig</code> (configurable sin recompilar)."],
                ["Bearer automático", "Inyecta <code>Authorization: Bearer</code> salvo <code>{ auth: false }</code> (rutas públicas)."],
                ["Timeout", "<code>AbortController</code> con <code>requestTimeoutMs</code> (15 s por defecto)."],
                ["Normalización de errores", "Todo fallo se convierte en <code>ApiError</code> con mensaje en español."],
                ["Refresh ante 401", "Un reintento transparente tras renovar la sesión."],
                ["Multipart", "Detecta <code>FormData</code> y deja que el runtime fije el boundary."],
            ],
        ),
    )
    + section(
        "errores",
        "ApiError: errores tipados",
        "<p>Los estados HTTP se mapean a categorías (<code>kind</code>) con un mensaje "
        "amistoso, sin filtrar detalles técnicos ni tokens.</p>",
        mermaid(
            """
            flowchart LR
              R["Respuesta HTTP"] --> C{"status"}
              C -->|401| U["unauthorized<br/>→ intenta refresh"]
              C -->|403| F["forbidden"]
              C -->|404| N["notFound"]
              C -->|422| V["validation<br/>(fieldErrors)"]
              C -->|5xx| S["server"]
              C -->|red / abort| T["network / timeout"]
              U --> E["ApiError"]
              F --> E
              N --> E
              V --> E
              S --> E
              T --> E
            """
        ),
        callout(
            "info",
            "En login, un 401 se traduce a “Correo/usuario o contraseña incorrectos” "
            "en vez de “sesión expirada”, para no confundir al usuario.",
        ),
    )
    + section(
        "peticion",
        "Ciclo de una petición",
        mermaid(
            """
            sequenceDiagram
              participant Sv as Servicio
              participant Api as api.ts
              participant Tk as tokenProvider
              participant B as Backend
              Sv->>Api: api.get('/ruta', {params})
              Api->>Tk: getToken()
              Tk-->>Api: access token
              Api->>B: fetch(url, headers, signal)
              alt 401 y auth
                Api->>Api: refreshSession()
                Api->>B: reintenta 1 vez
              end
              B-->>Api: JSON / error
              Api-->>Sv: datos tipados | throw ApiError
            """
        ),
    )
)

# ===========================================================================
# CONFIGURACIÓN DE SERVIDOR
# ===========================================================================
CONFIG_SERVIDOR = (
    section(
        "porque",
        "Por qué es configurable",
        "<p>Pawcare es <b>open source y self-hosted</b>: cada organización puede correr "
        "su propio backend. Por eso la URL del servidor se elige <b>en tiempo de "
        "ejecución</b>, sin recompilar, desde la pantalla <em>Configurar servidor</em> "
        "(accesible desde la bienvenida de login y desde los ajustes del staff).</p>",
    )
    + section(
        "runtime",
        "serverConfig: URL en runtime",
        "<p>La URL activa vive en memoria (acceso síncrono para el cliente HTTP) y se "
        "persiste en <code>AsyncStorage</code> bajo <code>pawcare.server_url</code>. "
        "Se restaura al arrancar la app, <b>antes</b> del primer fetch de sesión.</p>",
        table(
            ["Función", "Rol"],
            [
                ["<code>getApiBaseUrl()</code>", "URL activa que usa <code>api.ts</code> (síncrona)."],
                ["<code>loadServerUrl()</code>", "Restaura la guardada al arrancar (en <code>App.tsx</code>)."],
                ["<code>setServerUrl(url)</code>", "Normaliza, activa y persiste una URL nueva."],
                ["<code>resetServerUrl()</code>", "Vuelve al valor por defecto del build."],
                ["<code>checkServerHealth(url)</code>", "Prueba <code>GET /up</code> (health check de Rails) con latencia."],
                ["<code>normalizeServerUrl(raw)</code>", "Añade esquema si falta y quita barras finales."],
            ],
        ),
    )
    + section(
        "arranque",
        "Arranque con la URL correcta",
        mermaid(
            """
            sequenceDiagram
              participant App as App.tsx
              participant Cfg as serverConfig
              participant AS as AsyncStorage
              participant Sess as SessionProvider
              App->>Cfg: loadServerUrl()
              Cfg->>AS: get('pawcare.server_url')
              AS-->>Cfg: URL guardada | vacío
              Cfg-->>App: (URL en memoria lista)
              App->>Sess: monta el árbol
              Sess->>Sess: fetchCurrentUser() usa getApiBaseUrl()
            """
        ),
        callout(
            "tip",
            "El emulador Android alcanza el <code>localhost</code> del host en "
            "<code>10.0.2.2</code>; por eso el valor de desarrollo por defecto es "
            "<code>http://10.0.2.2:3000</code>.",
        ),
    )
)

# ===========================================================================
# SERVICIOS DE DOMINIO
# ===========================================================================
SERVICIOS = (
    section(
        "patron",
        "Un servicio por dominio",
        "<p>Cada dominio tiene un archivo en <code>src/services/</code> con funciones "
        "que envuelven rutas reales del backend y devuelven tipos de "
        "<code>src/types/models.ts</code>. Las pantallas importan estos servicios; "
        "nunca al revés.</p>",
    )
    + section(
        "catalogo",
        "Catálogo de servicios",
        table(
            ["Servicio", "Responsabilidad", "Rutas (ejemplos)"],
            [
                ["<code>auth</code>", "Login, registro, sesión, refresh, recuperación.", "<code>/auth/mobile/*</code>"],
                ["<code>profile</code>", "Editar perfil, cambiar contraseña, eliminar cuenta.", "<code>/profile</code>"],
                ["<code>pets</code>", "Mascotas del dueño (CRUD).", "<code>/pets</code>"],
                ["<code>appointments</code>", "Citas del dueño + disponibilidad + agendar.", "<code>/owner-appointments*</code>"],
                ["<code>payments</code>", "Pagos del dueño y detalle.", "<code>/owner-payments*</code>"],
                ["<code>medical</code>", "Perfil médico, consultas, vacunas, desparasitaciones, reportes.", "<code>/pets/:id/*</code>"],
                ["<code>sponsorships</code>", "Patrocinios del dueño y mascotas apadrinables.", "<code>/sponsorships</code>"],
                ["<code>public</code>", "Productos, adopción y landing (sin auth).", "<code>/public/*</code>, <code>/adoption/*</code>, <code>/landing</code>"],
                ["<code>orders</code>", "Pedidos de tienda y comprobante (sin auth).", "<code>/public/product_orders*</code>"],
                ["<code>admin</code>", "Todo el staff: pacientes, citas, pagos, médico, adopciones, métricas.", "<code>/admin/*</code>"],
            ],
        ),
    )
    + section(
        "admin-detalle",
        "El servicio admin (el más amplio)",
        "<p>Cubre la operación de toda la clínica: listados globales, detalle, creación "
        "y edición de pacientes, registro de pagos, creación de consultas y vacunas, "
        "perfil médico, adopciones y el <b>wizard de citas</b> (dueño → mascota → "
        "servicio → día → veterinario → hora) contra los endpoints de disponibilidad "
        "de <code>/admin/appointments/*</code>.</p>",
        callout(
            "info",
            "La agenda del staff pide <code>scope=all</code> para ver citas de "
            "cualquier fecha (el backend filtra “próximas” por defecto).",
        ),
    )
)

# ===========================================================================
# ÁREA PÚBLICA
# ===========================================================================
PANTALLAS_PUBLICO = (
    section(
        "resumen",
        "Qué ve un visitante sin sesión",
        "<p>El área pública es el escaparate de la clínica: servicios, tienda, "
        "adopción, patrocinios y contacto, más el acceso a login/registro. Todo con "
        "datos reales de rutas públicas.</p>",
        table(
            ["Pantalla", "Función"],
            [
                ["PublicLanding", "Hub con accesos + selector de tema."],
                ["Services", "Servicios publicados (desde <code>/landing</code>)."],
                ["Products / ProductDetail", "Catálogo de tienda con stock y precio."],
                ["Checkout", "Pedido real: cantidad, método de pago y contacto."],
                ["UploadProof", "Sube el comprobante (transferencia / pago móvil)."],
                ["AdoptionLanding / List / Detail", "Mascotas en adopción y sus requisitos."],
                ["SponsorshipsList / Detail", "Mascotas apadrinables y nº de padrinos."],
                ["Contact / Terms / Privacy", "Información de contacto y legal."],
            ],
        ),
    )
    + section(
        "checkout",
        "Flujo de compra",
        mermaid(
            """
            flowchart LR
              P["Products"] --> D["ProductDetail"]
              D -->|"Comprar"| C["Checkout<br/>cantidad · pago · contacto"]
              C -->|"crea pedido real"| O[("ProductOrder")]
              C -->|"transferencia / pago móvil"| U["UploadProof<br/>expo-image-picker"]
              C -->|"en tienda"| L["Landing (confirmado)"]
              U -->|"multipart"| O
            """
        ),
    )
)

# ===========================================================================
# ÁREA DEL DUEÑO
# ===========================================================================
PANTALLAS_OWNER = (
    section(
        "resumen",
        "El portal del dueño",
        "<p>Cuatro pestañas: <b>Inicio</b> (resumen), <b>Mascotas</b>, <b>Citas</b> y "
        "<b>Perfil</b>. Toda la información pertenece al dueño autenticado.</p>",
        table(
            ["Pestaña", "Pantallas"],
            [
                ["Inicio", "Dashboard: nº de mascotas, próxima cita, pagos pendientes, accesos rápidos."],
                ["Mascotas", "Lista + detalle + alta/edición; hub de salud por mascota."],
                ["— Salud", "Perfil médico, vacunas, desparasitaciones, consultas, reportes."],
                ["Citas", "Próximas/pasadas + <b>wizard</b> de agendado (mascota→servicio→día→vet→hora)."],
                ["Perfil", "Datos, editar perfil, cambiar contraseña, tema, cerrar sesión, eliminar cuenta."],
            ],
        ),
    )
    + section(
        "wizard",
        "Wizard de cita (dueño)",
        mermaid(
            """
            flowchart LR
              M["Mascota"] --> S["Servicio"] --> D["Día<br/>(disponibles)"]
              D --> V["Veterinario<br/>(disponibles ese día)"]
              V --> H["Hora<br/>(slots del vet)"]
              H --> C["Confirmar → crea cita"]
            """
        ),
        callout(
            "ok",
            "La eliminación de cuenta llama a <code>DELETE /profile</code> "
            "(soft-delete en el backend) y cierra la sesión.",
        ),
    )
)

# ===========================================================================
# ÁREA DEL STAFF
# ===========================================================================
PANTALLAS_ADMIN = (
    section(
        "resumen",
        "El panel del staff",
        "<p>Cuatro pestañas: <b>Inicio</b> (métricas de la clínica), <b>Pacientes</b>, "
        "<b>Agenda</b> y <b>Más</b> (módulos clínicos + ajustes). Alcance: toda la "
        "clínica, no un solo dueño.</p>",
        table(
            ["Pestaña", "Pantallas"],
            [
                ["Inicio", "Métricas: pacientes, consultas, citas hechas; accesos a módulos."],
                ["Pacientes", "Todas las mascotas + detalle + alta/edición + perfil médico."],
                ["Agenda", "Todas las citas con filtros de estado + <b>wizard</b> de cita."],
                ["Más", "Consultas, vacunas, desparasitaciones, pagos, reportes, prescripciones, exámenes, esquemas."],
                ["— Ajustes", "Tema, <em>Configurar servidor</em> y <b>cerrar sesión</b>."],
            ],
        ),
    )
    + section(
        "wizard-admin",
        "Wizard de cita (staff)",
        "<p>Como el del dueño pero empieza eligiendo al <b>dueño</b> y su mascota, y usa "
        "los endpoints de disponibilidad del namespace admin.</p>",
        mermaid(
            """
            flowchart LR
              O["Dueño"] --> M["Mascota del dueño"] --> S["Servicio"]
              S --> D["Día"] --> V["Veterinario"] --> H["Hora"] --> C["Crear cita"]
            """
        ),
    )
)

# ===========================================================================
# COMPONENTES Y TEMA
# ===========================================================================
COMPONENTES = (
    section(
        "familias",
        "Tres familias de componentes",
        table(
            ["Familia", "Ejemplos", "Rol"],
            [
                ["<code>ui</code>", "Button, TextField, Card, Badge, FilterChips, InfoBanner, AsyncBoundary, EmptyState, Fab", "Bloques básicos sin lógica de dominio."],
                ["<code>domain</code>", "ListRow, AppointmentCard, PaymentCard, ProductCard, DetailHero, StepIndicator, ThemeToggle", "Piezas con semántica de negocio."],
                ["<code>layout</code>", "MobileShell, AppHeader", "Estructura de pantalla (header, scroll, safe area)."],
            ],
        ),
        "<p>Se reexportan desde <code>@/components</code> para importarlas en un solo "
        "sitio.</p>",
    )
    + section(
        "tema",
        "Tema y modo oscuro",
        "<p><code>ThemeProvider</code> expone <code>colors</code>, <code>scheme</code> "
        "y <code>preference</code> (system/light/dark). La preferencia se persiste en "
        "<code>AsyncStorage</code> y se hidrata antes del primer render (sin "
        "parpadeo).</p>",
        mermaid(
            """
            flowchart LR
              T["ThemeToggle"] -->|"nextThemePreference"| P{"preferencia"}
              P --> SY["system"] --> SC["esquema del SO"]
              P --> LI["light"]
              P --> DA["dark"]
              SC --> C["colors activos"]
              LI --> C
              DA --> C
              C --> UI["toda la app"]
            """
        ),
        callout(
            "tip",
            "<code>ThemeToggle</code> es una fila reutilizable presente en el perfil del "
            "dueño, en los ajustes del staff y en el landing público.",
        ),
    )
)

# ===========================================================================
# ESTADO, DATOS Y HOOKS
# ===========================================================================
ESTADO_DATOS = (
    section(
        "useasync",
        "useAsync + AsyncBoundary",
        "<p>El patrón de carga de datos de toda la app. <code>useAsync(fn)</code> "
        "ejecuta la función una vez al montar y devuelve <code>{data, loading, error, "
        "reload}</code>. <code>AsyncBoundary</code> traduce ese estado a UI.</p>",
        code(
            """
            const { data, loading, error, reload } = useAsync(() => listPets());
            return (
              <AsyncBoundary loading={loading && data === null}
                             error={error} onRetry={reload}
                             empty={(data ?? []).length === 0}>
                {data?.map(pet => <PetRow key={pet.id} pet={pet} />)}
              </AsyncBoundary>
            );
            """
        ),
    )
    + section(
        "tipos",
        "Tipos y utilidades",
        table(
            ["Módulo", "Contenido"],
            [
                ["<code>types/models.ts</code>", "Tipos de dominio alineados con los enums del backend (Species, AppointmentStatus, PaymentStatus…)."],
                ["<code>types/api.ts</code>", "<code>ApiError</code>, <code>RequestOptions</code>, <code>FieldErrors</code>."],
                ["<code>utils/format.ts</code>", "Fechas y montos (<code>formatDate</code>, <code>formatMoney</code>)."],
                ["<code>utils/schedule.ts</code>", "<code>generateTimeSlots</code> para el wizard de citas."],
                ["<code>utils/secureStore.ts</code>", "Lectura/escritura de tokens cifrados."],
                ["<code>hooks/useAuth · useTheme</code>", "Acceso a sesión y tema."],
            ],
        ),
    )
)

# ===========================================================================
# LOCAL-FIRST
# ===========================================================================
LOCAL_FIRST = (
    section(
        "objetivo",
        "Objetivo",
        "<p>Que el staff pueda registrar <b>consultas, historias, pesajes, vacunas y "
        "desparasitaciones</b> desde el móvil <b>sin conexión</b>, guardándolas en el "
        "dispositivo, y sincronizarlas después (Wi-Fi o datos móviles, con permiso). "
        "El plan completo vive en <code>LOCAL_FIRST_PLAN.md</code>.</p>",
        callout(
            "warn",
            "Estado actual: <b>Fase 1</b> implementada (base de datos local + "
            "migraciones). La sincronización (F2–F7) está en el roadmap.",
        ),
    )
    + section(
        "capa",
        "Capa de datos local (F1)",
        "<p>Una interfaz <code>SqlExecutor</code> abstrae el motor: en la app la "
        "implementa <code>expo-sqlite</code>; en los tests, <code>node:sqlite</code> "
        "(SQLite real en Node, sin mocks). Las migraciones son idempotentes.</p>",
        mermaid(
            """
            flowchart TB
              R["Repositorios de dominio<br/>(F3+)"] --> EX["SqlExecutor<br/>(interfaz)"]
              EX --> A["expo-sqlite<br/>(app)"]
              EX --> B["node:sqlite<br/>(tests)"]
              A --> DB[("pawcare.db")]
              DB --> T1["weighings (piloto)"]
              DB --> T2["sync_outbox (bitácora)"]
              DB --> T3["schema_migrations"]
            """
        ),
    )
    + section(
        "sync",
        "Sincronización diferida (roadmap)",
        "<p>Patrón <b>outbox</b>: toda mutación se guarda local con id de cliente "
        "(UUID) y se encola; un motor la envía cuando hay red, de forma "
        "<b>idempotente</b>. El pull incremental refresca desde el servidor.</p>",
        mermaid(
            """
            sequenceDiagram
              participant UI as Pantalla
              participant Repo as Repositorio local
              participant OB as sync_outbox
              participant Net as Conectividad
              participant B as Backend
              UI->>Repo: crear pesaje (offline)
              Repo->>OB: encola mutación (uuid)
              Note over UI: aparece como "pendiente"
              Net-->>Repo: hay conexión
              Repo->>B: POST con client_uuid (idempotente)
              B-->>Repo: server_id
              Repo->>OB: marca "sincronizado"
            """
        ),
    )
)

# ===========================================================================
# TESTING
# ===========================================================================
TESTING = (
    section(
        "filosofia",
        "Integración real, sin mocks",
        "<p>Los tests de hooks, servicios y utilidades son de <b>integración real</b> "
        "contra el backend en ejecución (<code>http://localhost:3000</code>). Lo único "
        "que se sustituye son shims de plataforma que no existen en Node "
        "(<code>expo-secure-store</code>, <code>AsyncStorage</code>) — nunca lógica de "
        "negocio ni respuestas del servidor.</p>",
        callout(
            "info",
            "Credenciales sembradas: <code>owner1@example.com</code>, "
            "<code>admin@pawcare.com</code>, <code>vet@pawcare.com</code> "
            "(todas <code>password123</code>).",
        ),
    )
    + section(
        "harness",
        "Cómo corren",
        table(
            ["Pieza", "Detalle"],
            [
                ["<code>yarn test</code>", "Apunta a <code>localhost:3000</code> vía <code>EXPO_PUBLIC_API_BASE_URL</code>."],
                ["<code>undici</code>", "Provee <code>fetch</code> real en el entorno Node de Jest."],
                ["<code>node:sqlite</code>", "SQLite real para los tests de la capa local."],
                ["RNTL", "Tests de componentes cuando aplica."],
            ],
        ),
        callout(
            "warn",
            "Correr toda la suite de golpe puede disparar el <b>rate-limit</b> del "
            "backend en <code>/auth</code> por exceso de logins.",
        ),
    )
    + section(
        "compuertas",
        "Compuertas de calidad (antes de cada commit)",
        mermaid(
            """
            flowchart LR
              A["yarn test"] --> B["yarn typecheck"] --> C["yarn lint"]
              C --> D["react-doctor --no-score"] --> E["yarn format"] --> OK["commit"]
            """
        ),
        "<p>Además, un hook <b>pre-push</b> (Husky) reejecuta lint+format+typecheck y "
        "bloquea el push si algo cambió o falla.</p>",
    )
)

# ===========================================================================
# Registro de páginas: slug -> (título, subtítulo, contenido)
# ===========================================================================
PAGES = {
    "index": (
        "Arquitectura de Pawcare Mobile",
        "Guía técnica por módulos, con diagramas ampliables al hacer click.",
        INDEX,
    ),
    "vision-general": (
        "Visión general",
        "Capas, flujo de datos y principios de ingeniería.",
        VISION,
    ),
    "navegacion": (
        "Navegación y roles",
        "Un árbol de navegación por audiencia: público, dueño y staff.",
        NAVEGACION,
    ),
    "sesion-autenticacion": (
        "Sesión y autenticación",
        "Bearer sobre /auth/mobile, refresh transparente y almacenamiento cifrado.",
        SESION,
    ),
    "capa-http": (
        "Capa HTTP",
        "El cliente api: Bearer, timeouts, errores tipados y refresh.",
        CAPA_HTTP,
    ),
    "configuracion-servidor": (
        "Configuración de servidor",
        "Self-hosted: elige tu backend en tiempo de ejecución.",
        CONFIG_SERVIDOR,
    ),
    "servicios-dominio": (
        "Servicios de dominio",
        "Un archivo por dominio contra las rutas reales del backend.",
        SERVICIOS,
    ),
    "pantallas-publico": (
        "Área pública",
        "Escaparate sin sesión: tienda, adopción, patrocinios y contacto.",
        PANTALLAS_PUBLICO,
    ),
    "pantallas-owner": (
        "Área del dueño",
        "Mascotas, citas, historial médico y perfil.",
        PANTALLAS_OWNER,
    ),
    "pantallas-admin": (
        "Área del staff",
        "Pacientes, agenda y módulos clínicos de toda la clínica.",
        PANTALLAS_ADMIN,
    ),
    "componentes-ui": (
        "Componentes y tema",
        "UI, dominio, layout y modo oscuro reutilizable.",
        COMPONENTES,
    ),
    "estado-datos": (
        "Estado, datos y hooks",
        "useAsync, tipos de dominio y utilidades.",
        ESTADO_DATOS,
    ),
    "local-first": (
        "Local-first y sincronización",
        "SQLite local, outbox idempotente y sincronización diferida.",
        LOCAL_FIRST,
    ),
    "testing": (
        "Testing y calidad",
        "Integración real contra el backend, sin mocks.",
        TESTING,
    ),
}
