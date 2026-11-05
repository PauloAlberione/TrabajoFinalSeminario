import { useEffect, useRef } from "react"

export function PaginaPoliticaPrivacidad({
  onBack: alVolver,
}: {
  onBack: () => void
}) {
  const titulo = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    const anterior = document.title
    document.title = "Política de privacidad | MenteClear"
    titulo.current?.focus()
    window.scrollTo(0, 0)
    return () => {
      document.title = anterior
    }
  }, [])
  return (
    <main
      className="min-h-screen px-5 py-8 md:px-10"
      style={{ background: "var(--background)", color: "var(--foreground)" }}
    >
      <article className="max-w-4xl mx-auto space-y-7 text-lg leading-relaxed break-words">
        <button
          onClick={alVolver}
          className="px-6 py-4 rounded-2xl font-bold"
          style={{ background: "var(--muted)" }}
        >
          ← Volver a MenteClear
        </button>
        <header className="space-y-3">
          <p className="font-bold" style={{ color: "var(--primary)" }}>
            MenteClear
          </p>
          <h1
            ref={titulo}
            tabIndex={-1}
            className="text-3xl md:text-4xl font-bold"
            style={{ fontFamily: "Fraunces, serif" }}
          >
            Política de privacidad
          </h1>
          <p>
            Versión 2 · Revisión del contenido:{" "}
            <time dateTime="2026-11-02">2 de noviembre de 2026</time>.
          </p>
          <p>
            MenteClear es un prototipo académico de estimulación cognitiva y
            seguimiento del desempeño. Esta página explica el tratamiento que
            contempla la implementación actual y señala la información que
            todavía falta confirmar.
          </p>
        </header>
        <section
          className="rounded-3xl p-6 space-y-3"
          style={{
            background: "var(--card)",
            border: "2px solid var(--border)",
          }}
          aria-labelledby="privacy-owner"
        >
          <h2 id="privacy-owner" className="text-2xl font-bold">
            Responsable y contacto pendientes de informar
          </h2>
          <p>
            El titular del proyecto debe completar la identidad y el domicilio
            del responsable del tratamiento, su relación con la institución
            académica si corresponde, y un canal real para consultas y ejercicio
            de derechos. Esta versión todavía no proporciona esos datos ni un
            correo de soporte verificado.
          </p>
          <p>
            La publicación de esta página no acredita una aprobación legal,
            inscripción de bases de datos ni certificación de cumplimiento.
          </p>
        </section>
        <section aria-labelledby="privacy-data" className="space-y-3">
          <h2 id="privacy-data" className="text-2xl font-bold">
            1. Qué información se utiliza y para qué
          </h2>
          <ul className="list-disc pl-7 space-y-3">
            <li>
              <strong>Cuenta y perfil.</strong> El registro actual solicita
              nombre, apellido, correo, fecha de nacimiento, género y contraseña
              como campos obligatorios. Se conserva un identificador de cuenta y
              las fechas de creación disponibles. El nombre identifica tu
              perfil, la fecha permite mostrar tu edad y el género se usa para
              la presentación del avatar. Podés indicar tu país y, cuando
              corresponde, una región de referencia para programar recordatorios
              con tu hora local. También se guarda el tono de avatar que elijas.
              Sin completar los campos exigidos no se puede finalizar el
              registro actual.
            </li>
            <li>
              <strong>Autenticación.</strong> Firebase Authentication, de
              Google, gestiona el acceso, las credenciales, la verificación del
              correo y la recuperación de contraseña. La contraseña se envía a
              ese servicio; no se guarda en los documentos de perfil ni de
              ejercicios de Firestore.
            </li>
            <li>
              <strong>Actividades, sesiones e historial.</strong> Se guardan los
              ejercicios realizados, fechas, estados de sesión, nivel,
              respuestas, aciertos, errores, intentos, tiempos y otras
              mediciones específicas disponibles. Para recuperar una actividad
              interrumpida también se puede guardar la instancia del ejercicio y
              su avance parcial. Estos datos permiten continuar actividades y
              consultar resultados reales.
            </li>
            <li>
              <strong>Progreso por categoría.</strong> Se conserva el nivel
              adaptativo y el progreso de memoria, lenguaje, cálculo, atención y
              reconocimiento y velocidad. Los resultados ajustan automáticamente
              la dificultad de cada categoría y alimentan las estadísticas. Este
              ajuste modifica los ejercicios ofrecidos; no toma decisiones
              médicas.
            </li>
            <li>
              <strong>Preferencias.</strong> Se guardan tamaño de letra,
              contraste, instrucciones ampliadas, sonido y volumen para adaptar
              la interfaz. Los efectos de audio se generan en el dispositivo;
              esta función no graba tu voz ni necesita el micrófono.
            </li>
            <li>
              <strong>Recordatorios opcionales.</strong> Si los solicitás, se
              guardan activación, frecuencia, días, hora y zona horaria, junto
              con comprobantes técnicos de intentos de envío y de baja. No son
              necesarios para usar los ejercicios. Guardar una preferencia no
              asegura un envío: hacen falta un correo verificado y la
              infraestructura configurada.
            </li>
          </ul>
          <p>
            Los resultados describen tu desempeño dentro de MenteClear. No son
            diagnósticos médicos ni evaluaciones clínicas validadas, y no
            permiten concluir por sí solos que tu estado cognitivo mejoró o
            empeoró.
          </p>
        </section>
        <section aria-labelledby="privacy-services" className="space-y-3">
          <h2 id="privacy-services" className="text-2xl font-bold">
            2. Dónde se procesan los datos y qué servicios intervienen
          </h2>
          <p>
            El backend procesa las operaciones de cuenta, sesiones, resultados y
            progreso. Cloud Firestore, de Google, almacena la información de la
            aplicación. Firebase Authentication gestiona la identidad de acceso.
          </p>
          <p>
            El envío opcional de recordatorios está integrado con Resend. Si se
            configura y activa, recibe tu dirección de correo y el contenido del
            aviso, que incluye enlaces a la aplicación y para desactivar los
            envíos. No se incluyen resultados de ejercicios. La programación
            está preparada para Google Cloud Scheduler y Cloud Run; esa
            preparación no confirma que estén desplegados o activos.
          </p>
          <p>
            La interfaz solicita tipografías a Google Fonts. Esa conexión
            comunica al proveedor datos técnicos de la solicitud, como la
            dirección IP. El código inspeccionado no inicializa Google Analytics
            ni herramientas publicitarias; esto no constituye una auditoría de
            los servicios externos.
          </p>
          <p>
            La consulta técnica del 2 de noviembre de 2026 confirmó que
            Firestore está en São Paulo, Brasil (región southamerica-east1),
            fuera de Argentina. Falta confirmar con el titular las ubicaciones
            de los demás servicios, las condiciones de los proveedores y el
            tratamiento de las transferencias internacionales. No hay cuentas
            separadas para familiares ni profesionales, ni una función para
            compartirles automáticamente tu historial.
          </p>
        </section>
        <section aria-labelledby="privacy-device" className="space-y-3">
          <h2 id="privacy-device" className="text-2xl font-bold">
            3. Información en tu dispositivo y registros técnicos
          </h2>
          <p>
            Firebase puede conservar el estado de autenticación en el navegador.
            MenteClear usa almacenamiento local y de pestaña para identificar
            actividades pendientes, conservar avances y controlar su
            recuperación entre pestañas. También guarda registros técnicos
            locales de eventos y errores; algunos pueden contener el
            identificador de cuenta o detalles de un fallo.
          </p>
          <p>
            Si se configura el servidor de registros, esos eventos también se
            envían a ese servidor y se escriben en archivos por fecha. No hay
            una eliminación automática general de esos archivos o de los
            registros locales implementada. Cerrar sesión no garantiza borrar
            todos los avances o registros almacenados en el dispositivo. En un
            dispositivo compartido, cerrá tu sesión y revisá los datos del sitio
            y los archivos descargados.
          </p>
        </section>
        <section aria-labelledby="privacy-security" className="space-y-3">
          <h2 id="privacy-security" className="text-2xl font-bold">
            4. Medidas de seguridad de la aplicación
          </h2>
          <p>
            Los endpoints privados verifican tokens de Firebase y obtienen de
            ellos la identidad del usuario. El backend limita las consultas
            privadas a esa cuenta y valida las entradas. Las reglas incluidas en
            el proyecto bloquean el acceso directo del cliente a los datos
            privados de Firestore; las operaciones de datos pasan por el
            backend.
          </p>
          <p>
            Las credenciales de envío y administración se configuran en el
            backend. Las transacciones protegen operaciones como el guardado de
            resultados y los intentos de recordatorios. Estas medidas no
            equivalen a una certificación, una auditoría integral ni una
            garantía absoluta de seguridad. Falta verificar las reglas realmente
            desplegadas, permisos de la infraestructura y protección de los
            registros. La configuración local de desarrollo puede usar HTTP;
            HTTPS y las condiciones del despliegue deben comprobarse antes del
            uso público.
          </p>
        </section>
        <section aria-labelledby="privacy-rights" className="space-y-3">
          <h2 id="privacy-rights" className="text-2xl font-bold">
            5. Cómo consultar, corregir y obtener tu información
          </h2>
          <p>
            En Perfil podés consultar tus datos y editar los campos personales
            permitidos, como nombre, apellido y fecha de nacimiento. El correo
            se muestra como solo lectura: no hay un cambio de correo habilitado
            en el perfil actual. Las preferencias se modifican desde
            Configuración y la dificultad se administra automáticamente.
          </p>
          <p>
            «Exportar mis datos» permite descargar una copia JSON de la cuenta,
            preferencias, progreso, sesiones y resultados, incluidas las
            métricas específicas registradas. Historial y Progreso también
            permiten descargar informes PDF de resultados. Los archivos se
            preparan a pedido; la implementación intenta eliminar los temporales
            del servidor al terminar o fallar la operación, pero no hay una
            limpieza periódica acreditada para restos tras una interrupción
            abrupta. Los archivos que descargues quedan bajo tu control y no se
            borran al cerrar sesión.
          </p>
          <p>
            Podés desactivar recordatorios en Perfil o confirmar la baja
            mediante el enlace del correo. Un aviso ya solicitado al proveedor
            puede llegar aunque la baja ocurra al mismo tiempo.
          </p>
          <p>
            En Argentina, la Ley 25.326 reconoce derechos de acceso,
            rectificación, actualización y, cuando corresponda, supresión o
            confidencialidad. La AAIP informa sobre el acceso gratuito con la
            periodicidad prevista por la ley y los plazos legales de respuesta:
            diez días corridos para acceso y cinco días hábiles para
            rectificación, actualización o supresión. Estos derechos no quedan
            reemplazados por las opciones de la aplicación.
          </p>
          <p>
            La Agencia de Acceso a la Información Pública (AAIP) es el organismo
            de control ante el que podés consultar o presentar reclamos.
            Consultá la{" "}
            <a
              className="underline font-semibold"
              href="https://www.argentina.gob.ar/aaip/datospersonales/derechos"
              rel="noreferrer"
            >
              información oficial sobre tus derechos
            </a>{" "}
            y el{" "}
            <a
              className="underline font-semibold"
              href="https://www.argentina.gob.ar/normativa/nacional/64790/actualizacion"
              rel="noreferrer"
            >
              texto actualizado de la Ley 25.326
            </a>
            . El titular todavía debe informar el canal para dirigirle
            solicitudes; hoy no hay un canal de solicitudes de derechos
            implementado en la plataforma.
          </p>
        </section>
        <section aria-labelledby="privacy-deletion" className="space-y-3">
          <h2 id="privacy-deletion" className="text-2xl font-bold">
            6. Eliminación permanente de cuenta
          </h2>
          <p>
            En Perfil, «Eliminar mi cuenta» permite solicitar la baja
            permanente. Debés confirmar expresamente la decisión y verificar tu
            contraseña con Firebase. El backend exige una autenticación
            reciente; no recibe tu contraseña.
          </p>
          <p>
            Una vez aceptada la eliminación, se bloquea el uso normal de la
            cuenta y se detienen nuevos recordatorios. Se deshabilita el acceso
            en Firebase Authentication, se eliminan recursivamente el perfil y
            sus subcolecciones —incluidos sesiones, resultados, progreso y
            preferencias— y se elimina la cuenta de autenticación. La acción no
            puede deshacerse.
          </p>
          <p>
            Si falla un paso, la cuenta queda bloqueada y la solicitud permanece
            pendiente. El comprobante privado guardado en esta pestaña permite
            reintentar incluso después de deshabilitar el acceso; no permite
            consultar datos. No se muestra una baja completada hasta que el
            backend confirma el proceso. El operador dispone también de un
            mecanismo de reintento para solicitudes pendientes, que debe
            configurar y supervisar.
          </p>
          <p>
            Para impedir escrituras atrasadas y permitir reintentos se conservan
            comprobantes técnicos mínimos. Las solicitudes pendientes conservan
            el identificador de cuenta hasta finalizar. Al completar se retira
            ese identificador del trabajo y se fija un vencimiento técnico de
            veinticuatro horas para el comprobante y el bloqueo seudonimizado.
            La purga automática requiere activar TTL en la infraestructura; no
            se afirma que ya esté activa.
          </p>
          <p>
            Después del éxito se cierra la sesión y se intenta limpiar el avance
            y los registros de MenteClear en este navegador. No se eliminan
            archivos que descargaste, datos guardados en otros dispositivos,
            correos ya enviados, registros históricos del servidor o de
            proveedores ni posibles copias externas. El titular debe definir su
            conservación y tramitar solicitudes que excedan el borrado de datos
            activos.
          </p>
        </section>
        <section aria-labelledby="privacy-retention" className="space-y-3">
          <h2 id="privacy-retention" className="text-2xl font-bold">
            7. Conservación y copias de seguridad
          </h2>
          <p>
            El proyecto no define un plazo general de eliminación automática
            para perfiles, sesiones, respuestas, resultados o progreso. La
            implementación permite que sigan almacenados; falta que el titular
            establezca y comunique una política de conservación.
          </p>
          <p>
            Los comprobantes de recordatorios incluyen un vencimiento técnico a
            treinta días para una posible limpieza TTL de Firestore. Esa
            limpieza requiere activación externa y no está acreditada por el
            repositorio. El vencimiento del enlace de baja tampoco elimina datos
            de la cuenta.
          </p>
          <p>
            La consulta de configuración del 2 de noviembre de 2026 no encontró
            backups programados ni backups registrados en el proyecto. PITR
            estaba deshabilitado y la API informó una retención de versiones de
            una hora. Es una comprobación puntual, no una promesa de
            configuración futura ni prueba de que no existan exportaciones o
            copias externas. La baja elimina los datos activos; no garantiza que
            todas las versiones históricas desaparezcan de inmediato. El titular
            debe revisar y comunicar cualquier cambio de conservación o backups.
          </p>
        </section>
        <section aria-labelledby="privacy-review" className="space-y-3">
          <h2 id="privacy-review" className="text-2xl font-bold">
            8. Información por completar y próximas revisiones
          </h2>
          <p>
            Antes de presentar esta política como información definitiva del
            servicio, el titular debe completar responsable, domicilio y
            contacto; revisar la finalidad y necesidad de los campos
            obligatorios; confirmar proveedores, ubicación y transferencias;
            definir la conservación de registros y copias externas y supervisar
            la eliminación; y revisar los mecanismos de información y
            consentimiento y las obligaciones legales aplicables. No se afirma
            cumplimiento formal ni aprobación de una autoridad.
          </p>
          <p>
            La política debe revisarse cuando cambien los datos utilizados, los
            servicios o las funciones disponibles. La versión y fecha de esta
            página permiten identificar el texto consultado.
          </p>
        </section>
        <button
          onClick={alVolver}
          className="px-6 py-4 rounded-2xl font-bold"
          style={{
            background: "var(--primary)",
            color: "var(--primary-foreground)",
          }}
        >
          Volver a MenteClear
        </button>
      </article>
    </main>
  )
}
