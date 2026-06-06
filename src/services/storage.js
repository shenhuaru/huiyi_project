const STORAGE_KEY = 'hotel_meetings';

export const storageService = {
  getAllMeetings() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveMeeting(meeting) {
    const meetings = this.getAllMeetings();
    const index = meetings.findIndex(m => m.id === meeting.id);
    
    if (index !== -1) {
      meetings[index] = { ...meeting, updatedAt: new Date().toISOString() };
    } else {
      meetings.unshift(meeting);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(meetings));
    return meeting;
  },

  getMeetingById(id) {
    const meetings = this.getAllMeetings();
    return meetings.find(m => m.id === id);
  },

  deleteMeeting(id) {
    const meetings = this.getAllMeetings().filter(m => m.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(meetings));
  },

  generateMeetingNumber() {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const meetings = this.getAllMeetings();
    const todayMeetings = meetings.filter(m => m.number && m.number.startsWith(`JD-${dateStr}`));
    const seq = String(todayMeetings.length + 1).padStart(3, '0');
    return `JD-${dateStr}-${seq}`;
  },

  formatDate(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const weekday = weekdays[d.getDay()];
    return `${year}年${month}月${day}日 (${weekday})`;
  }
};
