# Catálogo de cuentas contables

API en NestJS para administrar un catálogo de cuentas contables jerárquico (Clase → Grupo → Cuenta → Subcuenta), organizada con Clean Architecture.

## Cómo se corre

Requisitos: **Node 22** (`nvm use`) y **npm 10 o superior**.

```bash
npm install
npm run start:dev    # http://localhost:3000
npm test             # pruebas unitarias con Vitest
npm run build        # compila a dist/
```

Los datos viven en memoria: se pierden al reiniciar el proceso.

## Endpoints

| Método | Ruta | Cuerpo | Respuesta |
|--------|------|--------|-----------|
| `POST` | `/accounts` | `{ "code": "1105", "name": "Caja", "nature"?: "DEBITO" \| "CREDITO" }` | `201` con la cuenta creada |
| `GET` | `/accounts/tree` | — | `200` con el catálogo anidado |
| `PATCH` | `/accounts/:code` | `{ "name": "Caja general" }` | `200` con la cuenta renombrada |
| `DELETE` | `/accounts/:code` | — | `204` sin cuerpo |

`nature` solo se envía al crear una clase (código de 1 dígito). Para las demás cuentas se hereda.

Ejemplo:

```bash
curl -X POST localhost:3000/accounts -H "Content-Type: application/json" \
  -d '{"code":"1","name":"Activo","nature":"DEBITO"}'
curl -X POST localhost:3000/accounts -H "Content-Type: application/json" \
  -d '{"code":"11","name":"Disponible"}'
curl localhost:3000/accounts/tree
```

```json
[
  {
    "code": "1", "name": "Activo", "level": "CLASE", "nature": "DEBITO",
    "children": [
      { "code": "11", "name": "Disponible", "level": "GRUPO", "nature": "DEBITO", "children": [] }
    ]
  }
]
```

### Errores

Todos los errores de dominio responden `{ statusCode, error, message }`, donde `error` es el tipo del error:

| Tipo | HTTP | Cuándo |
|------|------|--------|
| `VALIDATION` | 400 | Código no numérico o de longitud distinta de 1, 2, 4 o 6; nombre vacío; clase sin naturaleza o con una naturaleza desconocida; cuenta que no es clase con naturaleza |
| `NOT_FOUND` | 404 | Renombrar o eliminar una cuenta que no existe |
| `CONFLICT` | 409 | Código duplicado; eliminar una cuenta que tiene hijas |
| `BUSINESS_RULE` | 422 | Crear una cuenta cuyo padre no existe |

## Estructura

```
src/catalog/
  domain/           Account, Level, Nature, errores de dominio y el puerto AccountRepository
  application/      Un caso de uso por operación, cada uno con su *.spec.ts
  infrastructure/
    persistence/    InMemoryAccountRepository (Map)
    http/           AccountsController y DomainExceptionFilter
  catalog.module.ts Conecta las piezas con la inyección de dependencias de Nest
```

## Decisiones

**Por qué Clean Architecture así.** Las dependencias apuntan hacia adentro: la infraestructura conoce a la aplicación y esta al dominio, nunca al revés.

- El dominio no importa nada de Nest. Todas las reglas están ahí: `Account.create` valida el código, el nombre y la naturaleza, y calcula el nivel y el padre. El constructor es privado, así que no se puede crear una cuenta inválida.
- Los casos de uso son clases planas, sin `@Injectable`, que reciben el repositorio por constructor. Así se prueban con `new CreateAccount(new InMemoryAccountRepository())`, sin levantar Nest. Su trabajo es lo que necesita el repositorio: revisar duplicados, buscar el padre y revisar si hay hijas.
- `CatalogModule` es el único lugar donde Nest arma todo. Usa `useFactory` con `inject: [ACCOUNT_REPOSITORY]`, y el token es un `Symbol` porque una interfaz no existe en tiempo de ejecución.
- Los errores de dominio llevan un `type` (`VALIDATION`, `NOT_FOUND`, `CONFLICT`, `BUSINESS_RULE`) en lugar de un código HTTP. El `DomainExceptionFilter` hace la traducción a HTTP, y el dominio no sabe que existe una API.

**Por qué memoria.** Lo que se evalúa es el modelo y las reglas, no el motor de base de datos. Un `Map` indexado por código hace que buscar sea O(1) y que el código sea único de forma natural. Además, el mismo repositorio sirve como fake en las pruebas. El puerto es asíncrono (`Promise`), así que pasar a una base de datos real significa escribir otro adaptador y cambiar una línea del módulo, sin tocar los casos de uso.

**Por qué el código es string.** El código es un identificador, no una cantidad: nunca se suma ni se compara por magnitud. Como string, la jerarquía se calcula con prefijos (`'110505'.slice(0, 4) === '1105'`), se conservan posibles ceros a la izquierda y no hay riesgo de perder precisión con códigos largos. Ordenar los strings en orden lexicográfico deja cada padre antes que sus hijas (`'1' < '11' < '1105' < '110505' < '12'`). Así el árbol se arma en una sola pasada con un `Map`.

**Herencia del padre directo.** Cada cuenta toma la naturaleza de su padre inmediato, no de la clase. Como el padre ya la heredó al crearse, el resultado es el mismo, pero solo hace falta una consulta (el padre que de todas formas se valida) en vez de recorrer la jerarquía. La naturaleza queda guardada en cada cuenta, y por eso el árbol se lee sin recalcular nada. Si se envía naturaleza a una cuenta que no es clase, se rechaza en vez de ignorarla en silencio, para que el cliente no crea que la aplicó.

**Otras decisiones:**

- El padre inexistente es una regla de negocio (422): la petición es válida, pero el catálogo no la permite.
- Eliminar con hijas es `CONFLICT` (409): la operación choca con el estado actual del recurso. Con ese mismo criterio, el código duplicado también es 409.
- No se usa class-validator, para no agregar dependencias. El cuerpo HTTP llega sin tipar y el dominio valida tipos y valores (por ejemplo, `code: 1` como número se rechaza con 400). Así la regla vive en un solo lugar.

## Qué dejé afuera

- Persistencia real (PostgreSQL u otra). Hoy los datos se pierden al reiniciar.
- Pruebas e2e de los endpoints. Los endpoints se probaron a mano y la lógica está cubierta por las pruebas unitarias de los casos de uso.
- `GET /accounts/:code` y búsqueda o paginación del catálogo.
- Cambiar el código o la naturaleza de una cuenta existente, y mover una cuenta de padre.
- Documentación OpenAPI/Swagger, autenticación y auditoría.

## Qué haría con más tiempo

- Un adaptador de persistencia con una restricción `UNIQUE` sobre el código y transacciones. Hoy la validación de duplicados y de hijas no es atómica frente a peticiones concurrentes.
- Pruebas e2e con `supertest` (ya está en el proyecto) para fijar el contrato HTTP y el mapeo de errores.
- Validación de entrada en el borde HTTP (pipe o esquema) para responder errores por campo, sin quitarle al dominio la validación de sus reglas.
- Carga inicial del PUC colombiano y un endpoint para importar el catálogo en bloque.
- Logs estructurados y un manejo explícito de errores no esperados (500).
