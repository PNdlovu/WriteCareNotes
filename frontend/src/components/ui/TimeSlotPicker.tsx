import { Clock } from 'lucide-react'

interface TimeSlotPickerProps {
  selectedTime: string | null
  onTimeSelect: (time: string) => void
  selectedDate: Date | null
  className?: string
}

const timeSlots = [
  { time: '9:00 AM', available: true },
  { time: '10:00 AM', available: true },
  { time: '11:00 AM', available: true },
  { time: '2:00 PM', available: true },
  { time: '3:00 PM', available: true },
  { time: '4:00 PM', available: true },
]

export function TimeSlotPicker({ selectedTime, onTimeSelect, selectedDate, className = '' }: TimeSlotPickerProps) {
  if (!selectedDate) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-6 text-center ${className}`}>
        <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-500">Please select a date first</p>
      </div>
    )
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <Clock className="h-5 w-5 mr-2 text-primary" />
        Available Times
      </h3>
      
      <div className="text-sm text-gray-600 mb-4">
        {selectedDate.toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {timeSlots.map(({ time, available }) => (
          <button
            key={time}
            onClick={() => available && onTimeSelect(time)}
            disabled={!available}
            className={`
              p-3 rounded-lg border text-sm font-medium transition-all
              ${!available 
                ? 'border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50' 
                : selectedTime === time
                  ? 'border-primary bg-primary text-white shadow-md'
                  : 'border-gray-200 text-gray-700 hover:border-primary hover:bg-primary hover:text-white'
              }
            `}
          >
            <div className="flex items-center justify-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>{time}</span>
            </div>
            {!available && (
              <div className="text-xs mt-1">Unavailable</div>
            )}
          </button>
        ))}
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Demo Duration:</strong> Approximately 30-45 minutes
        </p>
      </div>
    </div>
  )
}