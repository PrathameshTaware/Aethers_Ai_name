'use client';

import { useState } from 'react';
import { UserCheck, Check, Clock, ShieldCheck } from 'lucide-react';

interface Teacher {
  id: string;
  name: string;
  role: string;
  assignedClass: string;
  status: 'ACKNOWLEDGED' | 'PENDING';
  assignedVenue: string;
}

export function TeacherRosterSection() {
  const [teachers, setTeachers] = useState<Teacher[]>([
    { id: 't1', name: 'Mr. Vikram Singh', role: 'PE Head Coach', assignedClass: '7A / 8A', status: 'ACKNOWLEDGED', assignedVenue: 'Indoor Gym 1' },
    { id: 't2', name: 'Ms. Ananya Sharma', role: 'Fitness Instructor', assignedClass: '7B / 9A', status: 'ACKNOWLEDGED', assignedVenue: 'Multipurpose Hall' },
    { id: 't3', name: 'Dr. Rajesh Verma', role: 'Senior Faculty', assignedClass: '6A', status: 'ACKNOWLEDGED', assignedVenue: 'Classroom 6A' },
    { id: 't4', name: 'Mrs. Sunita Kapoor', role: 'Lab Supervisor', assignedClass: '10A', status: 'PENDING', assignedVenue: 'Physics Lab 2' },
  ]);

  const toggleStatus = (id: string) => {
    setTeachers(prev => prev.map(t => t.id === id ? {
      ...t,
      status: t.status === 'ACKNOWLEDGED' ? 'PENDING' : 'ACKNOWLEDGED'
    } : t));
  };

  return (
    <div className="p-6 rounded-3xl bg-[#11382d]/90 border border-[#1e5646] shadow-2xl space-y-6 backdrop-blur-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-xl bg-[#061a14] text-[#34d399] border border-[#1e5646] shadow-sm">
              <UserCheck className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-extrabold text-white tracking-tight">
              Teacher Roster & Venue Allocation
            </h2>
          </div>
          <p className="text-slate-200 text-xs font-medium">
            Status of faculty assignments and indoor room allocations under Stage III
          </p>
        </div>

        <div className="text-xs font-mono font-bold px-3.5 py-1.5 rounded-full bg-[#061a14] border border-[#1e5646] text-[#34d399] shadow-sm">
          {teachers.filter(t => t.status === 'ACKNOWLEDGED').length} / {teachers.length} Acknowledged
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {teachers.map((teacher) => (
          <div
            key={teacher.id}
            className="p-4 rounded-2xl bg-[#09261d] border border-[#1e5646] flex items-center justify-between gap-4 hover:border-[#10b981]/50 transition-all duration-300 shadow-lg group"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white text-sm">{teacher.name}</span>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#061a14] text-[#fbbf24] font-mono font-bold border border-[#1e5646]">
                  {teacher.assignedClass}
                </span>
              </div>
              <div className="text-xs text-slate-300 font-medium">{teacher.role}</div>
              <div className="text-xs text-slate-200 font-mono flex items-center gap-1.5 pt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#34d399]" />
                <span className="font-medium">Venue: {teacher.assignedVenue}</span>
              </div>
            </div>

            <button
              onClick={() => toggleStatus(teacher.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer shadow-md ${
                teacher.status === 'ACKNOWLEDGED'
                  ? 'bg-[#10b981]/20 text-[#34d399] border border-[#10b981]/50 hover:bg-[#10b981]/30 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                  : 'bg-[#f59e0b]/20 text-[#fbbf24] border border-[#f59e0b]/50 hover:bg-[#f59e0b]/30 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
              }`}
            >
              {teacher.status === 'ACKNOWLEDGED' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#34d399]" />
                  <span>Acknowledged</span>
                </>
              ) : (
                <>
                  <Clock className="w-3.5 h-3.5 text-[#fbbf24]" />
                  <span>Pending</span>
                </>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
