'use client';

import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Algor Orchestrator</h1>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-8">Dashboard</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            href="/dashboard/campaigns"
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <h3 className="text-xl font-semibold mb-2">📊 Кампании</h3>
            <p className="text-gray-600">Создание и управление рассылками</p>
          </Link>

          <Link
            href="/dashboard/contacts"
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <h3 className="text-xl font-semibold mb-2">👥 Контакты</h3>
            <p className="text-gray-600">База контактов и импорт</p>
          </Link>

          <Link
            href="/dashboard/templates"
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <h3 className="text-xl font-semibold mb-2">📝 Шаблоны</h3>
            <p className="text-gray-600">Шаблоны сообщений по каналам</p>
          </Link>

          <Link
            href="/dashboard/segments"
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <h3 className="text-xl font-semibold mb-2">🎯 Сегменты</h3>
            <p className="text-gray-600">Сегментация аудитории</p>
          </Link>

          <Link
            href="/dashboard/consents"
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <h3 className="text-xl font-semibold mb-2">✅ Согласия</h3>
            <p className="text-gray-600">Управление согласиями (152-ФЗ)</p>
          </Link>

          <Link
            href="/dashboard/orchestration"
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <h3 className="text-xl font-semibold mb-2">⚙️ Оркестрация</h3>
            <p className="text-gray-600">YAML политики отправок</p>
          </Link>
        </div>

        <div className="mt-12 bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-4">Быстрые действия</h3>
          <div className="space-y-3">
            <p className="text-gray-600">
              🚀 Запустите <code className="bg-gray-100 px-2 py-1 rounded">make dev</code> для старта всех сервисов
            </p>
            <p className="text-gray-600">
              📖 API документация доступна на <a href="http://localhost:3001/docs" className="text-blue-600 hover:underline">http://localhost:3001/docs</a>
            </p>
            <p className="text-gray-600">
              📧 Mailhog для тестирования email: <a href="http://localhost:8025" className="text-blue-600 hover:underline">http://localhost:8025</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

