# @metamorph/istate

Фабрика состояний: схема Zod, прокси Valtio, события и sync-экстеншен.

## Установка

```bash
yarn add @metamorph/istate zod
```

`zod` — peer dependency, схемы должны быть созданы тем же экземпляром пакета. `useSnapshot` живёт в `@metamorph/istate/react` и требует `react`.

## Пример

Рабочие сценарии — в [`examples/app/state`](examples/app/state): пользователь, адреса и корзина, регистрация стейтов и init-хуки. Там же события, загрузка данных и `addSync`.

```typescript
import { stateFactory } from '@metamorph/istate'
import { z } from 'zod'

const counter = stateFactory({
  id: 'counter',
  loggerCategory: 'app',
  schema: z.object({
    value: z.number().default(0),
  }),
  getters: [],
  setPrototype: (base) => ({
    ...base,
    inc() {
      this.value += 1
    },
  }),
})
```

Логгер, storage и отложенный init на этой версии — простые модульные реализации. Их можно подменить через `setStateLoggerFactory`, `setStateStorage` и `setInitScheduler`. Даты в storage сериализуются обычным `JSON.stringify`.

## Скрипты

- `yarn build` — ESM и декларации в `dist`
- `yarn typecheck`
- `yarn test` / `yarn test:watch` / `yarn test:coverage`
- `yarn lint`

## Лицензия

MIT.
