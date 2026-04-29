import { redirect } from 'next/navigation'

// Halaman /survey tidak memiliki konten sendiri.
// Otomatis redirect ke /survey/baru agar tidak 404.
export default function SurveyIndexPage() {
  redirect('/survey/baru')
}
