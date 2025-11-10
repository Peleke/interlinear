import { LatinTextReader } from '@/components/latin/LatinTextReader';

export default function LatinDemoPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-4xl px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Latin Text Reader Demo</h1>
          <p className="mt-2 text-gray-600">
            Click any word to see its morphological analysis and dictionary definition.
          </p>
        </div>

        <div className="space-y-8">
          {/* Caesar - Gallic Wars */}
          <div className="rounded-lg bg-white p-6 shadow">
            <LatinTextReader
              text="Gallia est omnis divisa in partes tres, quarum unam incolunt Belgae, aliam Aquitani, tertiam qui ipsorum lingua Celtae, nostra Galli appellantur."
              title="De Bello Gallico"
              author="Julius Caesar, Book 1, Chapter 1"
            />
          </div>

          {/* Cicero - First Catiline Oration */}
          <div className="rounded-lg bg-white p-6 shadow">
            <LatinTextReader
              text="Quo usque tandem abutere, Catilina, patientia nostra? Quam diu etiam furor iste tuus nos eludet?"
              title="In Catilinam I"
              author="Marcus Tullius Cicero"
            />
          </div>

          {/* Virgil - Aeneid */}
          <div className="rounded-lg bg-white p-6 shadow">
            <LatinTextReader
              text="Arma virumque cano, Troiae qui primus ab oris Italiam, fato profugus, Laviniaque venit litora."
              title="Aeneid"
              author="Publius Vergilius Maro, Book 1"
            />
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 rounded-lg bg-blue-50 p-6">
          <h3 className="font-semibold text-blue-900">How to use:</h3>
          <ul className="mt-2 space-y-1 text-sm text-blue-800">
            <li>• Click any Latin word to see its analysis</li>
            <li>• View morphology (case, number, gender, etc.)</li>
            <li>• See dictionary definitions from Lewis & Short</li>
            <li>• Press ESC or click outside to close the popover</li>
          </ul>
        </div>

        {/* Service Status */}
        <ServiceStatus />
      </div>
    </div>
  );
}

function ServiceStatus() {
  return (
    <div className="mt-8 rounded-lg bg-gray-100 p-4">
      <h3 className="text-sm font-semibold text-gray-700">Service Status</h3>
      <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
        <a
          href="/api/latin/health"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          Check Health Status
        </a>
        <span>•</span>
        <span className="text-green-600">● Dictionary: Lewis & Short (51,596 entries)</span>
        <span>•</span>
        <span className="text-green-600">● Morphology: CLTK Service</span>
      </div>
    </div>
  );
}
