import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex-1 p-6 flex flex-col justify-center items-center text-center">
      <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mb-4 shadow-md">
        DE
      </div>
      <h1 className="text-2xl font-bold text-slate-800 mb-2">
        Zsóca Német Segéd
      </h1>
      <p className="text-slate-600 text-sm mb-6 max-w-xs">
        Beszédfókuszú interaktív német nyelvfejlesztő alkalmazás.
      </p>
      <Link
        href="/assessment"
        className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium rounded-xl shadow-sm transition duration-150 block text-center"
      >
        Szintfelmérés Indítása
      </Link>
    </main>
  );
}
