import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
// import './App.css'; // อย่าลืม import ไฟล์ css

const API = 'https://week6-mern.onrender.com';

/* ========== SVG Donut Progress Ring ========== */
function ProgressRing({ percent, size = 140, strokeWidth = 12, label, color }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="progress-ring-wrapper">
      <svg width={size} height={size} className="progress-ring-svg">
        <defs>
          <linearGradient id={`grad-${color}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color === 'cyan' ? '#00f2fe' : color === 'purple' ? '#8b5cf6' : '#ec4899'} />
            <stop offset="100%" stopColor={color === 'cyan' ? '#4facfe' : color === 'purple' ? '#c084fc' : '#ff416c'} />
          </linearGradient>
          <filter id={`glow-${color}`}>
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background track */}
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={strokeWidth} />

        {/* Progress arc */}
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={`url(#grad-${color})`}
          strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          filter={`url(#glow-${color})`}
          style={{ transition: 'stroke-dashoffset 1s ease-out', transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
        />

        {/* Center text */}
        <text x="50%" y="45%" textAnchor="middle" dominantBaseline="central" className="progress-ring-percent">
          {Math.round(percent)}%
        </text>
        <text x="50%" y="65%" textAnchor="middle" dominantBaseline="central" className="progress-ring-label">
          {label}
        </text>
      </svg>
    </div>
  );
}

/* ========== Mini Bar Chart ========== */
function MiniBarChart({ pending, done, total }) {
  const pendingPct = total > 0 ? (pending / total) * 100 : 0;
  const donePct = total > 0 ? (done / total) * 100 : 0;

  return (
    <div className="mini-bar-chart">
      <div className="bar-row">
        <span className="bar-label">ค้างอยู่</span>
        <div className="bar-track"><div className="bar-fill pending" style={{ width: `${pendingPct}%` }}></div></div>
        <span className="bar-value" style={{ color: '#ec4899' }}>{pending}</span>
      </div>
      <div className="bar-row">
        <span className="bar-label">เสร็จแล้ว</span>
        <div className="bar-track"><div className="bar-fill done" style={{ width: `${donePct}%` }}></div></div>
        <span className="bar-value" style={{ color: '#00f2fe' }}>{done}</span>
      </div>
    </div>
  );
}

/* ========== Main App ========== */
function App() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const fetchTasks = async () => {
    try {
      const res = await axios.get(API);
      setTasks(res.data);
    } catch (err) {
      console.error('ไม่สามารถโหลดข้อมูลได้:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 3000);
    return () => clearInterval(interval);
  }, []);

  const addTask = async (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    try {
      const res = await axios.post(API, { text: newTask.trim() });
      setTasks([res.data, ...tasks]);
      setNewTask('');
      Swal.fire({
        title: 'เพิ่มงานสำเร็จ ✨', icon: 'success', toast: true, position: 'top-end',
        timer: 1500, showConfirmButton: false, background: 'rgba(20,20,30,0.9)', color: '#fff'
      });
    } catch (err) {
      console.error('ไม่สามารถเพิ่มงานได้:', err);
    }
  };

  const toggleTask = async (id) => {
    try {
      const res = await axios.put(`${API}/${id}`);
      setTasks(tasks.map(t => t._id === id ? res.data : t));
    } catch (err) {
      console.error('ไม่สามารถอัปเดตสถานะได้:', err);
    }
  };

  const deleteTask = async (id) => {
    const result = await Swal.fire({
      title: 'ลบรายการนี้?', text: 'คุณไม่สามารถกู้คืนได้หลังจากลบ', icon: 'warning',
      showCancelButton: true, confirmButtonColor: '#ff4b2b', cancelButtonColor: '#4b5563',
      confirmButtonText: 'ลบทิ้ง', cancelButtonText: 'ยกเลิก',
      background: 'rgba(20,20,30,0.95)', color: '#fff', backdrop: 'rgba(0,0,0,0.6)'
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`${API}/${id}`);
        setTasks(tasks.filter(t => t._id !== id));
      } catch (err) {
        console.error('ไม่สามารถลบงานได้:', err);
      }
    }
  };

  const filteredTasks = tasks.filter(task => {
    const text = task.text || task.title || '';
    const matchSearch = text.toLowerCase().includes(search.toLowerCase());
    if (filter === 'pending') return !task.completed && matchSearch;
    if (filter === 'completed') return task.completed && matchSearch;
    return matchSearch;
  });

  const totalCount = tasks.length;
  const pendingCount = tasks.filter(t => !t.completed).length;
  const doneCount = tasks.filter(t => t.completed).length;
  const completionPercent = useMemo(() => (totalCount > 0 ? (doneCount / totalCount) * 100 : 0), [totalCount, doneCount]);
  const pendingPercent = useMemo(() => (totalCount > 0 ? (pendingCount / totalCount) * 100 : 0), [totalCount, pendingCount]);

  return (
    <>
      {/* Background Animated Blobs */}
      <div className="aurora-bg">
        <div className="aurora-blob"></div>
        <div className="aurora-blob"></div>
        <div className="aurora-blob"></div>
      </div>

      <div className="app-layout">
        {/* ===== LEFT SIDEBAR ===== */}
        <aside className="sidebar">
          <div className="sidebar-card glass-panel">
            <h3 className="sidebar-title">ความคืบหน้า</h3>
            <ProgressRing percent={completionPercent} label="เสร็จสิ้น" color="cyan" />
            <div className="sidebar-stat-row">
              <div className="sidebar-stat">
                <span className="sidebar-stat-value" style={{ color: '#00f2fe' }}>{doneCount}</span>
                <span className="sidebar-stat-label">เสร็จแล้ว</span>
              </div>
              <div className="sidebar-stat">
                <span className="sidebar-stat-value">{totalCount}</span>
                <span className="sidebar-stat-label">ทั้งหมด</span>
              </div>
            </div>
          </div>
        </aside>

        {/* ===== MAIN CONTENT ===== */}
        <main className="app-container">
          <h1 className="app-title">Task Master</h1>
          <p className="app-subtitle">จัดการงานของคุณอย่างมืออาชีพด้วยดีไซน์สุดล้ำ</p>

          <div className="main-card glass-panel">

            {/* Controls: Search & Filter */}
            <div className="controls-group">
              <div className="search-bar">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                </svg>
                <input type="text" placeholder="ค้นหางานของคุณ..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>

              <div className="filter-tabs">
                <button className={`tab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>ทั้งหมด</button>
                <button className={`tab ${filter === 'pending' ? 'active' : ''}`} onClick={() => setFilter('pending')}>ค้างอยู่</button>
                <button className={`tab ${filter === 'completed' ? 'active' : ''}`} onClick={() => setFilter('completed')}>เสร็จแล้ว</button>
              </div>
            </div>

            {/* Add Task Input */}
            <form className="input-area" onSubmit={addTask}>
              <input type="text" placeholder="พิมพ์งานที่ต้องการเพิ่ม..." value={newTask} onChange={(e) => setNewTask(e.target.value)} />
              <button type="submit" className="btn-add">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                เพิ่มงาน
              </button>
            </form>

            {/* Task List */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#a1a1aa' }}>กำลังโหลดข้อมูล...</div>
            ) : filteredTasks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#71717a' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>📝</div>
                <p>ไม่พบรายการงาน เริ่มต้นเพิ่มงานใหม่ได้เลย!</p>
              </div>
            ) : (
              <div className="task-list">
                {filteredTasks.map((task) => (
                  <div key={task._id} className={`task-item ${task.completed ? 'completed' : ''}`}>
                    <button className="task-checkbox" onClick={() => toggleTask(task._id)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </button>
                    <span className="task-text" onClick={() => toggleTask(task._id)}>
                      {task.text || task.title}
                    </span>
                    <button className="btn-delete" onClick={() => deleteTask(task._id)} aria-label="ลบงาน">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>

        {/* ===== RIGHT SIDEBAR ===== */}
        <aside className="sidebar">
          <div className="sidebar-card glass-panel">
            <h3 className="sidebar-title">งานที่ต้องทำ</h3>
            <ProgressRing percent={pendingPercent} label="ค้างอยู่" color="purple" />
            <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-glass)' }}>
              <MiniBarChart pending={pendingCount} done={doneCount} total={totalCount} />
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}

export default App;