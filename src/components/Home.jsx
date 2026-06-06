import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Calendar, Clock, FolderOpen, Trash2, LogOut, Settings } from 'lucide-react';
import { MEETING_TYPES } from '../types';
import { storageService } from '../services/storage';

function Home({ onLogout }) {
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadMeetings();
  }, []);

  const loadMeetings = () => {
    setMeetings(storageService.getAllMeetings());
  };

  const filteredMeetings = meetings.filter(m => 
    m.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.type?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateMeeting = (typeId) => {
    const meetingType = MEETING_TYPES.find(t => t.id === typeId);
    const newMeeting = {
      id: Date.now().toString(),
      title: meetingType ? meetingType.name : '',
      type: typeId,
      number: storageService.generateMeetingNumber(),
      date: new Date().toISOString().slice(0, 10),
      startTime: '09:00',
      endTime: '10:00',
      location: '',
      host: '',
      hostTitle: '',
      recorder: '',
      recorderTitle: '',
      attendees: '',
      absentees: '',
      absenteeReason: '',
      topics: [''],
      departmentReports: '',
      discussions: '',
      actions: [],
      others: '',
      rawText: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    storageService.saveMeeting(newMeeting);
    navigate(`/meeting/${newMeeting.id}`);
  };

  const handleDeleteMeeting = (e, id) => {
    e.stopPropagation();
    if (confirm('确定要删除这个会议记录吗？')) {
      storageService.deleteMeeting(id);
      loadMeetings();
    }
  };

  const getMeetingTypeName = (typeId) => {
    const type = MEETING_TYPES.find(t => t.id === typeId);
    return type ? type.name : '其他';
  };

  const getMeetingTypeIcon = (typeId) => {
    const type = MEETING_TYPES.find(t => t.id === typeId);
    return type ? type.icon : '📋';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-primary text-white py-6 px-4 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold">🏨 酒店智能会议记录助手</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (confirm('确定要修改密码吗？')) {
                    localStorage.removeItem('app_password');
                    localStorage.removeItem('app_authenticated');
                    window.location.href = '/login';
                  }
                }}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                title="修改密码"
              >
                <Settings className="w-5 h-5" />
              </button>
              <button
                onClick={onLogout}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                title="退出登录"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
          <p className="text-blue-100">高效记录，精准追踪</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="搜索会议记录..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        {/* Quick Access */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-primary" />
            常用会议类型
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {MEETING_TYPES.map(type => (
              <button
                key={type.id}
                onClick={() => handleCreateMeeting(type.id)}
                className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-primary transition-all text-left"
              >
                <div className="text-2xl mb-2">{type.icon}</div>
                <div className="font-medium text-gray-800">{type.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Meeting History */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            历史记录
          </h2>
          {filteredMeetings.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center text-gray-500">
              <div className="text-4xl mb-3">📝</div>
              <p>还没有会议记录</p>
              <p className="text-sm">点击上方卡片创建第一个会议</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMeetings.map(meeting => (
                <div
                  key={meeting.id}
                  onClick={() => navigate(`/meeting/${meeting.id}`)}
                  className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md cursor-pointer transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-3xl">{getMeetingTypeIcon(meeting.type)}</div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{meeting.title || '未命名会议'}</h3>
                      <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {meeting.date || ''}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {getMeetingTypeName(meeting.type)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDeleteMeeting(e, meeting.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Home;
