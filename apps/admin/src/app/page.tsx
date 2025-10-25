import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Algor Orchestrator
          </h1>
          <p className="text-xl text-gray-600 mb-12">
            Мультиарендная платформа оркестрации рассылок для партнёров школы «Алгоритмика»
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <Link
              href="/login"
              className="p-8 bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow"
            >
              <h3 className="text-2xl font-semibold mb-2">Вход</h3>
              <p className="text-gray-600">Войти в существующий аккаунт</p>
            </Link>

            <Link
              href="/dashboard"
              className="p-8 bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow"
            >
              <h3 className="text-2xl font-semibold mb-2">Dashboard</h3>
              <p className="text-gray-600">Панель управления кампаниями</p>
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-semibold mb-6">Возможности платформы</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div>
                <h4 className="font-semibold mb-2">📱 Омниканальность</h4>
                <p className="text-sm text-gray-600">
                  Telegram, VK, Email, SMS, WhatsApp
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">🔒 Compliance</h4>
                <p className="text-sm text-gray-600">
                  152-ФЗ, 38-ФЗ, антибан-логика
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">⚙️ Политика как код</h4>
                <p className="text-sm text-gray-600">
                  YAML-конфигурация отправок
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 text-sm text-gray-500">
            <p>API документация: <a href="http://localhost:3001/docs" className="text-blue-600 hover:underline">http://localhost:3001/docs</a></p>
            <p className="mt-2">Mailhog UI: <a href="http://localhost:8025" className="text-blue-600 hover:underline">http://localhost:8025</a></p>
          </div>
        </div>
      </div>
    </div>
  );
}

