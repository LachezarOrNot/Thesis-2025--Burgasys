Burgasys 🌐
Дигитална екосистема за образователни и обществени събития в Бургас. Централизирана платформа, свързваща ученици, учители, университети, фирми и граждани на едно място — напълно безплатно, без реклами.
Live demo: https://burgasys.web.app/

Функционалности

Интерактивна карта — real-time маркери на събития с Leaflet + OpenStreetMap
Управление на събития — CRUD, 5 категории, Grid и Calendar изгледи
Групов чат — real-time съобщения с emoji поддръжка за всяко събитие
P2P видео комуникация — безплатни видео разговори без медиа сървър (Agora RTC)
6-степенна RBAC система — Admin · School · University · Firm · Student · User
5 езика — БГ, EN, DE, RU, UK с автоматично разпознаване (i18next)
Admin панел — управление на потребители, верификация на организации, Recharts статистики


Технологии
FrontendBackend & ИнтеграцииReact 18.3.1Firebase 10.14.1 (Firestore, Auth, Storage)TypeScript 5.9.3Agora RTC SDK 4.24.2Vite 7.1.9Leaflet 1.9.4 + OpenStreetMapTailwind CSS 3.4.18i18next 25.6.2Framer Motion 12.xRecharts 3.4.1React Router 6.30.1Puppeteer 24.x

Стартиране
bashgit clone https://github.com/LachezarOrNot/Thesis-2025--Burgasys.git
cd Burgasys
npm install
npm run dev
Отвори http://localhost:5173

Конфигурация
Създай .env файл в root директорията:
envVITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_AGORA_APP_ID=...

Архитектура
src/
├── components/       # UI компоненти
├── contexts/         # AuthContext, ThemeContext
├── pages/            # Маршрутизирани страници
├── services/
│   └── database.ts   # Единна точка за Firestore операции
├── types/            # TypeScript дефиниции
└── i18n/             # Преводи (bg, en, de, ru, uk)
Data flow: Компонент → database.ts → Firebase → onSnapshot → UI
