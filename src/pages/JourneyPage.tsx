import BottomNav from '@/components/BottomNav'

export default function JourneyPage() {
  return (
    <div className="app-page bg-[#F8FAFC]">
      <header className="mx-auto w-full max-w-[560px] px-5 pb-4 pt-8">
        <h1 className="text-3xl font-black tracking-tight text-primary">Journey</h1>
      </header>
      <main className="mx-auto w-full max-w-[560px] px-5 pt-10 text-center">
        <p className="text-lg font-medium text-[#687281]">Journey tracking coming soon!</p>
      </main>
      <BottomNav activeRoute="/journey" />
    </div>
  )
}
