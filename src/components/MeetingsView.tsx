import { useState, type FC } from 'react';
import { useAgentStore } from '../store/useAgentStore';
import { CalendarDays, ListTodo } from 'lucide-react';

export const MeetingsView: FC = () => {
  const { meetings } = useAgentStore();
  const [selectedMeetingId, setSelectedMeetingId] = useState(meetings[0]?.id || 'meet_1');

  const selectedMeeting = meetings.find((m) => m.id === selectedMeetingId) || meetings[0];

  return (
    <div className="space-y-6 font-sans">
      {/* Banner */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 font-mono text-xs font-bold uppercase mb-1">
            <CalendarDays className="h-4 w-4" /> AI Audio &amp; Video Transcript Intelligence
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Meetings &amp; Transcripts Hub</h2>
          <p className="text-xs text-slate-400 font-mono">
            Automated transcript processing, key decision highlights, and task extraction.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-mono text-xs">
        {/* Meetings List */}
        <div className="space-y-2">
          {meetings.map((meet) => {
            const isSelected = meet.id === selectedMeetingId;
            return (
              <div
                key={meet.id}
                onClick={() => setSelectedMeetingId(meet.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected ? 'bg-indigo-950/60 border-indigo-500 shadow-md' : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex justify-between items-center text-[10px] text-slate-400 mb-1">
                  <span>{meet.date}</span>
                  <span>{meet.durationMinutes} mins</span>
                </div>
                <h4 className="text-xs font-bold text-white font-sans mb-1">{meet.title}</h4>
                <p className="text-[10px] text-indigo-300">Participants: {meet.participants.join(', ')}</p>
              </div>
            );
          })}
        </div>

        {/* Meeting Transcript & Actions Detail */}
        {selectedMeeting && (
          <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-5">
            <div className="border-b border-slate-800 pb-4">
              <span className="text-xs text-indigo-400 font-mono font-bold uppercase">{selectedMeeting.date} • {selectedMeeting.durationMinutes} mins</span>
              <h3 className="text-base font-bold text-white font-sans mt-1">{selectedMeeting.title}</h3>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-mono font-bold text-slate-400 uppercase">AI Transcript Summary</span>
              <p className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 leading-relaxed font-sans text-xs">
                {selectedMeeting.transcriptSummary}
              </p>
            </div>

            <div className="space-y-2 font-mono text-xs">
              <span className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1.5">
                <ListTodo className="h-4 w-4 text-emerald-400" /> Extracted Action Items
              </span>
              <div className="space-y-2">
                {(selectedMeeting.actionItems || []).map((act, idx) => {
                  const taskText = typeof act === 'string' ? act : act?.task || String(act);
                  const assigneeText = typeof act === 'string' ? 'CEO Agent' : act?.assignee || 'Assigned';
                  return (
                    <div key={idx} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                      <span className="text-slate-200 font-sans text-xs">{taskText}</span>
                      <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded text-[10px] shrink-0 ml-2">
                        Assignee: {assigneeText}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
