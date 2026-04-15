interface StatProps {
  title: string
  value: string | number
  icon: string
  color: string
}

export const StatCard = ({ title, value, icon, color }: StatProps) => (
  <div className="flex items-center rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
    <div className={`mr-4 rounded-full p-3 ${color} text-white`}>
      <span>{icon}</span>
    </div>
    <div>
      <p className="text-sm font-medium text-gray-500 uppercase">{title}</p>
      <h4 className="text-2xl font-bold text-gray-800">{value}</h4>
    </div>
  </div>
)