import { useEffect, useMemo, useState } from 'react'
import './App.css'

type TimerStatus = 'idle' | 'running' | 'paused' | 'finished'

type StudyTimer = {
  id: number
  name: string
  durationSec: number
}

const QUICK_PRESETS = [
  15, 20, 30, 45, 60, 300, 600, 900, 1200, 1500, 1800, 2700,
]

const ALARM_SOUNDS = [
  'Đồng hồ báo thức',
  'Tiếng kèn',
  'Tiếng gà gáy',
  'Tiếng còi',
  'Tiếng báo động hạt nhân',
  'Tiếng sinh vật ngoài hành tinh',
  'Tiếng bom',
  'Âm thanh huyền bí',
  'Tiếng nhiễu',
  'Tiếng chuông',
  'Tiếng mưa',
]

const MENU_ITEMS = [
  'Đồng hồ báo thức online',
  'Đồng hồ đếm ngược',
  'Đếm ngược ngày',
  'Đồng hồ bấm giờ online',
  'Đồng hồ online',
  'Đồng hồ thế giới',
  'Múi giờ thế giới',
  'Đếm ngày online',
  'Máy tính giờ',
  'Tuần hiện tại',
  'Tính tuổi online',
]

const LANGUAGES = [
  'AR العربية',
  'BG Български',
  'CS Čeština',
  'DA Dansk',
  'DE Deutsch',
  'EL Ελληνικά',
  'EN English',
  'ES Español',
  'FI Suomi',
  'FR Français',
  'HE עברית',
  'HR Hrvatski',
  'HU Magyar',
  'ID Bahasa Indonesia',
  'IT Italiano',
  'JA 日本語',
  'KO 한국어',
  'NL Nederlands',
  'NO Norsk Bokmål',
  'PL Polski',
  'PT Português',
  'RO Română',
  'RU Русский',
  'SK Slovenčina',
  'SR Srpski',
  'SV Svenska',
  'TH ภาษาไทย',
  'TR Türkçe',
  'UK Українська',
  'VI Tiếng Việt',
  'ZH-CN 中文(简体)',
  'ZH-TW 中文(台灣)',
]

const pad2 = (value: number) => value.toString().padStart(2, '0')

const formatHms = (totalSec: number) => {
  const safe = Math.max(0, totalSec)
  const h = Math.floor(safe / 3600)
  const m = Math.floor((safe % 3600) / 60)
  const s = safe % 60
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}`
}

const formatDurationLabel = (sec: number) => {
  if (sec < 60) return `${sec} giây`
  const m = sec / 60
  return `${m} phút`
}

function App() {
  const [hours, setHours] = useState('00')
  const [minutes, setMinutes] = useState('01')
  const [seconds, setSeconds] = useState('00')
  const [alarmSound, setAlarmSound] = useState(ALARM_SOUNDS[0])
  const [timerName, setTimerName] = useState('')
  const [repeatAlarm, setRepeatAlarm] = useState(false)
  const [showEndTime, setShowEndTime] = useState(true)
  const [showProgressBar, setShowProgressBar] = useState(true)
  const [volume, setVolume] = useState(100)
  const [isStudyMode, setIsStudyMode] = useState(false)
  const [speedMultiplier, setSpeedMultiplier] = useState(1)

  const [status, setStatus] = useState<TimerStatus>('idle')
  const [remainingSec, setRemainingSec] = useState(0)
  const [initialSec, setInitialSec] = useState(0)
  const [startedAt, setStartedAt] = useState<Date | null>(null)
  const [stoppedAt, setStoppedAt] = useState<Date | null>(null)
  const [history, setHistory] = useState<
    { id: number; name: string; duration: number; started: Date | null; stopped: Date | null }[]
  >([])

  const [studyTimers, setStudyTimers] = useState<StudyTimer[]>([
    { id: 1, name: 'Làm việc / học tập', durationSec: 1800 },
    { id: 2, name: 'Giải lao ngắn', durationSec: 300 },
  ])
  const [activeStudyIndex, setActiveStudyIndex] = useState(0)
  const [isLoop, setIsLoop] = useState(false)

  const totalInputSec = useMemo(() => {
    const h = Number(hours) || 0
    const m = Number(minutes) || 0
    const s = Number(seconds) || 0
    return h * 3600 + m * 60 + s
  }, [hours, minutes, seconds])

  const activeDuration = isStudyMode
    ? studyTimers[activeStudyIndex]?.durationSec ?? 0
    : initialSec || totalInputSec

  const progressPercent =
    activeDuration > 0
      ? Math.min(
          100,
          Math.max(0, ((activeDuration - remainingSec) / activeDuration) * 100),
        )
      : 0

  const endTime = useMemo(() => {
    if (status === 'finished' && stoppedAt) {
      return stoppedAt.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      })
    }
    if ((status === 'running' || status === 'paused') && remainingSec > 0) {
      const d = new Date()
      d.setSeconds(d.getSeconds() + remainingSec / Math.max(1, speedMultiplier))
      return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    }
    return null
  }, [remainingSec, speedMultiplier, status, stoppedAt])

  useEffect(() => {
    if (status !== 'running') return
    const intervalMs = Math.max(10, Math.floor(1000 / Math.max(0.1, speedMultiplier)))
    const id = window.setInterval(() => {
      setRemainingSec((prev) => {
        if (prev <= 1) {
          setStatus('finished')
          setStoppedAt(new Date())
          return 0
        }
        return prev - 1
      })
    }, intervalMs)
    return () => window.clearInterval(id)
  }, [status, speedMultiplier])

  useEffect(() => {
    if (status !== 'finished') return
    if (isStudyMode && studyTimers.length > 0) {
      const nextIndex = activeStudyIndex + 1
      if (nextIndex < studyTimers.length) {
        setActiveStudyIndex(nextIndex)
        const nextDuration = studyTimers[nextIndex].durationSec
        setInitialSec(nextDuration)
        setRemainingSec(nextDuration)
        setStatus('running')
        setStartedAt(new Date())
        return
      }
      if (isLoop) {
        setActiveStudyIndex(0)
        const firstDuration = studyTimers[0].durationSec
        setInitialSec(firstDuration)
        setRemainingSec(firstDuration)
        setStatus('running')
        setStartedAt(new Date())
        return
      }
    }
    setHistory((prev) => [
      {
        id: prev.length + 1,
        name: timerName || 'Đồng hồ hẹn giờ',
        duration: initialSec,
        started: startedAt,
        stopped: new Date(),
      },
      ...prev,
    ])
  }, [
    activeStudyIndex,
    initialSec,
    isLoop,
    isStudyMode,
    startedAt,
    status,
    studyTimers,
    timerName,
  ])

  const setTimeBySeconds = (value: number) => {
    const h = Math.floor(value / 3600)
    const m = Math.floor((value % 3600) / 60)
    const s = value % 60
    setHours(pad2(h))
    setMinutes(pad2(m))
    setSeconds(pad2(s))
  }

  const startSingleTimer = () => {
    if (totalInputSec <= 0) return
    setInitialSec(totalInputSec)
    setRemainingSec(totalInputSec)
    setStatus('running')
    setStartedAt(new Date())
    setStoppedAt(null)
  }

  const startStudyTimer = () => {
    if (!studyTimers.length) return
    const duration = studyTimers[0].durationSec
    setActiveStudyIndex(0)
    setInitialSec(duration)
    setRemainingSec(duration)
    setStatus('running')
    setStartedAt(new Date())
    setStoppedAt(null)
  }

  const onStart = () => {
    if (isStudyMode) {
      startStudyTimer()
      return
    }
    startSingleTimer()
  }

  const onRestart = () => {
    if (activeDuration <= 0) return
    setRemainingSec(activeDuration)
    setStatus('running')
    setStartedAt(new Date())
    setStoppedAt(null)
  }

  const onStop = () => {
    setHistory((prev) => [
      {
        id: prev.length + 1,
        name: timerName || 'Đồng hồ hẹn giờ',
        duration: initialSec || totalInputSec,
        started: startedAt,
        stopped: new Date(),
      },
      ...prev,
    ])
    setStatus('idle')
    setRemainingSec(0)
    setInitialSec(0)
    setStoppedAt(new Date())
    setActiveStudyIndex(0)
  }

  const updateStudyTimer = (id: number, changes: Partial<StudyTimer>) => {
    setStudyTimers((prev) =>
      prev.map((timer) => (timer.id === id ? { ...timer, ...changes } : timer)),
    )
  }

  const addStudyTimer = () => {
    const nextId = Math.max(0, ...studyTimers.map((item) => item.id)) + 1
    setStudyTimers((prev) => [
      ...prev,
      { id: nextId, name: `Khoảng ${prev.length + 1}`, durationSec: 300 },
    ])
  }

  const removeStudyTimer = (id: number) => {
    setStudyTimers((prev) => prev.filter((item) => item.id !== id))
  }

  const isRunningView =
    status === 'running' || status === 'paused' || status === 'finished'

  if (isRunningView) {
    const size = 520
    const stroke = 14
    const radius = (size - stroke) / 2
    const circumference = 2 * Math.PI * radius
    const dashOffset = (progressPercent / 100) * circumference

    return (
      <div className="running-view">
        <header className="running-header">
          <div className="running-brand">
            <div>Online Alarm Kur</div>
            <div className="menu-label">Menu</div>
          </div>
          <div className="running-title">Đồng hồ đếm ngược</div>
          <div className="running-icons">
            <span>⚙</span>
            <span>💡</span>
            <span>⛶</span>
          </div>
        </header>

        <div className="ring-wrap">
          <svg width={size} height={size} className="ring-svg">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="#2a2f3a"
              strokeWidth={stroke}
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="#35c4ef"
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          </svg>
          <div className="ring-content">
            <div className="ring-label">{timerName || 'Đồng hồ hẹn giờ'}</div>
            <div className="ring-clock">{formatHms(remainingSec)}</div>
            {showEndTime && endTime && (
              <div className="ring-end">
                <span className="bell">🔔</span> {endTime}
              </div>
            )}
          </div>
        </div>

        <div className="running-progress">
          <div className="running-progress-bar">
            <div
              className="running-progress-fill"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          <div className="running-progress-label">{Math.round(progressPercent)}%</div>
        </div>

        <div className="running-actions">
          <button className="btn-restart" onClick={onRestart}>
            Khởi động lại
          </button>
          <button className="btn-stop" onClick={onStop}>
            Dừng
          </button>
        </div>

        <div className="running-speed">
          <span>Tốc độ trôi thời gian</span>
          <div className="speed-options">
            {[1, 2, 5, 10, 30, 60].map((v) => (
              <button
                key={v}
                className={speedMultiplier === v ? 'speed-chip active' : 'speed-chip'}
                onClick={() => setSpeedMultiplier(v)}
              >
                {v}x
              </button>
            ))}
            <input
              type="number"
              min={1}
              max={1000}
              value={speedMultiplier}
              onChange={(e) =>
                setSpeedMultiplier(Math.max(1, Math.min(1000, Number(e.target.value) || 1)))
              }
            />
          </div>
        </div>
      </div>
    )
  }

  const deleteHistoryRow = (id: number) => {
    setHistory((prev) => prev.filter((row) => row.id !== id))
  }

  return (
    <main className="timer-page">
      <header className="site-header">
        <div className="brand-block">
          <div className="brand">Online Alarm Kur</div>
          <div className="menu-label">Menu</div>
        </div>
        <div className="header-icons">
          <span>⚙</span>
          <span>💡</span>
          <span>⛶</span>
        </div>
      </header>

      <h1 className="page-title">Đồng hồ đếm ngược</h1>

      <section className="panel">
        <div className="section-head">
          <h2>Đặt một đồng hồ hẹn giờ</h2>
          <div className="tabs">
            <button
              className={!isStudyMode ? 'tab active' : 'tab'}
              onClick={() => setIsStudyMode(false)}
            >
              Đồng hồ hẹn giờ
            </button>
            <button
              className={isStudyMode ? 'tab active' : 'tab'}
              onClick={() => setIsStudyMode(true)}
            >
              Chế độ học tập
            </button>
          </div>
        </div>

        <div className="time-grid">
          <label>
            Số giờ
            <select value={hours} onChange={(e) => setHours(e.target.value)}>
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={pad2(i)}>
                  {pad2(i)}
                </option>
              ))}
            </select>
          </label>
          <label>
            Số phút
            <select value={minutes} onChange={(e) => setMinutes(e.target.value)}>
              {Array.from({ length: 60 }, (_, i) => (
                <option key={i} value={pad2(i)}>
                  {pad2(i)}
                </option>
              ))}
            </select>
          </label>
          <label>
            Số giây
            <select value={seconds} onChange={(e) => setSeconds(e.target.value)}>
              {Array.from({ length: 60 }, (_, i) => (
                <option key={i} value={pad2(i)}>
                  {pad2(i)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="presets">
          {QUICK_PRESETS.map((preset) => (
            <button
              key={preset}
              className="preset-link"
              onClick={() => setTimeBySeconds(preset)}
            >
              <span className="bell">🔔</span> {formatDurationLabel(preset)}
            </button>
          ))}
        </div>
      </section>

      {isStudyMode && (
        <section className="panel">
          <div className="section-head">
            <h2>Chế độ học tập</h2>
            <div className="study-tools">
              <button onClick={addStudyTimer}>+ Thêm hẹn giờ</button>
              <label>
                <input
                  type="checkbox"
                  checked={isLoop}
                  onChange={(e) => setIsLoop(e.target.checked)}
                />
                Lặp lại
              </label>
            </div>
          </div>
          <div className="study-list">
            {studyTimers.map((item, index) => (
              <div
                key={item.id}
                className={`study-item ${index === activeStudyIndex ? 'active' : ''}`}
              >
                <input
                  value={item.name}
                  onChange={(e) => updateStudyTimer(item.id, { name: e.target.value })}
                />
                <input
                  type="number"
                  min={1}
                  value={Math.floor(item.durationSec / 60)}
                  onChange={(e) =>
                    updateStudyTimer(item.id, {
                      durationSec: Math.max(1, Number(e.target.value) || 1) * 60,
                    })
                  }
                />
                <span>phút</span>
                <button onClick={() => removeStudyTimer(item.id)}>X</button>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="panel">
        <div className="section-head">
          <h2>Âm thanh báo thức</h2>
          <button className="text-link">▷ Kiểm tra âm thanh</button>
        </div>
        <select
          className="wide"
          value={alarmSound}
          onChange={(e) => setAlarmSound(e.target.value)}
        >
          {ALARM_SOUNDS.map((sound) => (
            <option key={sound} value={sound}>
              {sound}
            </option>
          ))}
        </select>
      </section>

      <section className="panel">
        <h2>Tên đồng hồ hẹn giờ</h2>
        <input
          className="wide"
          value={timerName}
          onChange={(e) => setTimerName(e.target.value)}
          placeholder="Đồng hồ hẹn giờ"
        />
      </section>

      <button className="start-btn" onClick={onStart}>
        Bắt đầu hẹn giờ
      </button>

      <section className="panel table-panel">
        <h2>Dữ liệu của đồng hồ hẹn giờ</h2>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Tên</th>
              <th>Đồng hồ hẹn giờ</th>
              <th>Đã bắt đầu</th>
              <th>Đã dừng lại</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty">
                  Chưa có dữ liệu
                </td>
              </tr>
            ) : (
              history.map((row, idx) => (
                <tr key={row.id}>
                  <td>{idx + 1}</td>
                  <td>{row.name}</td>
                  <td className="duration-cell">{formatHms(row.duration)}</td>
                  <td>
                    {row.started
                      ? `${row.started.toLocaleDateString('vi-VN')} - ${row.started.toLocaleTimeString(
                          'vi-VN',
                          { hour: '2-digit', minute: '2-digit' },
                        )}`
                      : '-'}
                  </td>
                  <td>
                    {row.stopped
                      ? `${row.stopped.toLocaleDateString('vi-VN')} - ${row.stopped.toLocaleTimeString(
                          'vi-VN',
                          { hour: '2-digit', minute: '2-digit' },
                        )}`
                      : '-'}
                  </td>
                  <td>
                    <button
                      className="row-close"
                      onClick={() => deleteHistoryRow(row.id)}
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {history.length > 0 && (
          <div className="table-actions">
            <button onClick={() => setHistory([])}>Xóa dữ liệu</button>
          </div>
        )}
      </section>

      <section className="panel settings">
        <h2>Cài đặt</h2>
        <div className="speed-control">
          <div className="speed-label">
            Tốc độ trôi thời gian
            <span className="speed-hint">
              (1x = thực tế, {speedMultiplier}x đang chọn)
            </span>
          </div>
          <div className="speed-options">
            {[1, 2, 5, 10, 30, 60, 120].map((v) => (
              <button
                key={v}
                className={speedMultiplier === v ? 'speed-chip active' : 'speed-chip'}
                onClick={() => setSpeedMultiplier(v)}
              >
                {v}x
              </button>
            ))}
            <input
              type="number"
              min={1}
              max={1000}
              value={speedMultiplier}
              onChange={(e) =>
                setSpeedMultiplier(
                  Math.max(1, Math.min(1000, Number(e.target.value) || 1)),
                )
              }
            />
          </div>
        </div>
        <label>
          <input
            type="checkbox"
            checked={repeatAlarm}
            onChange={(e) => setRepeatAlarm(e.target.checked)}
          />
          Lặp lại âm báo thức
        </label>
        <label>
          <input
            type="checkbox"
            checked={showEndTime}
            onChange={(e) => setShowEndTime(e.target.checked)}
          />
          Hiển thị thời điểm đổ chuông
        </label>
        <label>
          <input
            type="checkbox"
            checked={showProgressBar}
            onChange={(e) => setShowProgressBar(e.target.checked)}
          />
          Hiển thị thanh tiến trình
        </label>
        <label>
          Âm lượng chuông báo {volume}
          <input
            type="range"
            min={0}
            max={100}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
          />
        </label>
      </section>

      <footer className="site-footer">
        <div className="footer-cols">
          <div>
            <h3>Bộ hẹn giờ</h3>
            {MENU_ITEMS.slice(0, 4).map((m) => (
              <p key={m}>{m}</p>
            ))}
          </div>
          <div>
            <h3>Thời gian</h3>
            {MENU_ITEMS.slice(4, 8).map((m) => (
              <p key={m}>{m}</p>
            ))}
          </div>
          <div>
            <h3>Máy tính</h3>
            {MENU_ITEMS.slice(8).map((m) => (
              <p key={m}>{m}</p>
            ))}
          </div>
          <div>
            <h3>Pháp lý</h3>
            <p>Về chúng tôi</p>
            <p>Chính sách bảo mật</p>
            <p>Các điều khoản dịch vụ</p>
            <p>Cài đặt cookie</p>
          </div>
        </div>
        <div className="social">YouTube Twitter Bluesky</div>
        <div className="copyright">Online Alarm Kur © 2026 Đã đăng ký bản quyền</div>
        <div className="langs">
          {LANGUAGES.map((lang) => (
            <span key={lang}>{lang}</span>
          ))}
        </div>
      </footer>
    </main>
  )
}

export default App
