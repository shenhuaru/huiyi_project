import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, FileText } from 'lucide-react';
import { storageService } from '../services/storage';
import { exportService } from '../services/export';

function MeetingPreview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState(null);

  useEffect(() => {
    const data = storageService.getMeetingById(id);
    if (data) {
      setMeeting(data);
    } else {
      navigate('/');
    }
  }, [id, navigate]);

  const handleExport = () => {
    const content = exportService.exportToMarkdown(meeting);
    const filename = `${meeting.title || '会议记录'}_${meeting.date || ''}.md`;
    exportService.downloadFile(content, filename, 'text/markdown');
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    const weekday = weekdays[d.getDay()];
    return `${year}年${month}月${day}日（星期${weekday}）`;
  };

  if (!meeting) return null;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate(`/meeting/${id}`)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5" />
            <span>返回编辑</span>
          </button>
          <h1 className="text-lg font-semibold text-gray-800">会议记录预览</h1>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
          >
            <Download className="w-4 h-4" />
            导出
          </button>
        </div>
      </div>

      {/* Preview Content */}
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-white shadow-sm rounded-xl p-8">
          {/* Header */}
          <div className="text-center mb-8 pb-6 border-b-2 border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">【酒店会议记录】</h1>
          </div>

          {/* Basic Info */}
          <div className="space-y-3 text-gray-700 mb-8">
            <div className="flex">
              <span className="font-medium w-24">会议名称：</span>
              <span>{meeting.title || '-'}</span>
            </div>
            <div className="flex">
              <span className="font-medium w-24">会议编号：</span>
              <span className="text-primary font-mono">{meeting.number || '-'}</span>
            </div>
            <div className="flex">
              <span className="font-medium w-24">会议时间：</span>
              <span>{formatDate(meeting.date)} {meeting.startTime || ''} - {meeting.endTime || ''}</span>
            </div>
            <div className="flex">
              <span className="font-medium w-24">会议地点：</span>
              <span>{meeting.location || '-'}</span>
            </div>
            <div className="flex">
              <span className="font-medium w-24">主持人：</span>
              <span>{meeting.host || ''} {meeting.hostTitle || ''}</span>
            </div>
            <div className="flex">
              <span className="font-medium w-24">记录人：</span>
              <span>{meeting.recorder || ''} {meeting.recorderTitle || ''}</span>
            </div>
            <div className="flex">
              <span className="font-medium w-24">参会人员：</span>
              <span>{meeting.attendees || '-'}</span>
            </div>
            {meeting.absentees && (
              <div className="flex">
                <span className="font-medium w-24">缺席人员：</span>
                <span>
                  {meeting.absentees}
                  {meeting.absenteeReason && `，缺席原因：${meeting.absenteeReason}`}
                </span>
              </div>
            )}
            <div>
              <span className="font-medium">会议议题：</span>
              <ol className="list-decimal list-inside ml-4 mt-1 space-y-1">
                {(meeting.topics || []).filter(t => t).map((topic, index) => (
                  <li key={index}>{topic}</li>
                ))}
                {(!meeting.topics || meeting.topics.filter(t => t).length === 0) && <li className="text-gray-400">-</li>}
              </ol>
            </div>
          </div>

          <hr className="my-6 border-gray-200" />

          {/* Main Content */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">一、会议主要内容</h2>

            <h3 className="text-lg font-semibold text-gray-800 mb-3">1.1 各部门工作汇报</h3>
            <div className="bg-gray-50 rounded-lg p-4 whitespace-pre-wrap text-gray-700">
              {meeting.departmentReports || '暂无内容'}
            </div>

            <h3 className="text-lg font-semibold text-gray-800 mb-3 mt-6">1.2 议题讨论与决议</h3>
            <div className="bg-gray-50 rounded-lg p-4 whitespace-pre-wrap text-gray-700">
              {meeting.discussions || '暂无内容'}
            </div>
          </div>

          <hr className="my-6 border-gray-200" />

          {/* Action Items */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">二、行动项清单</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700 w-12">序号</th>
                    <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">任务内容</th>
                    <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700 w-32">责任部门/人</th>
                    <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700 w-28">完成时限</th>
                    <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">验收标准</th>
                    <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700 w-24">备注</th>
                  </tr>
                </thead>
                <tbody>
                  {(meeting.actions || []).length > 0 ? (
                    (meeting.actions || []).map((action, index) => (
                      <tr key={action.id}>
                        <td className="border border-gray-300 px-3 py-2 text-center">{index + 1}</td>
                        <td className="border border-gray-300 px-3 py-2">{action.content || '-'}</td>
                        <td className="border border-gray-300 px-3 py-2">{action.responsible || '-'}</td>
                        <td className="border border-gray-300 px-3 py-2">{action.deadline || '-'}</td>
                        <td className="border border-gray-300 px-3 py-2">{action.standard || '-'}</td>
                        <td className="border border-gray-300 px-3 py-2">{action.remark || '-'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="border border-gray-300 px-3 py-8 text-center text-gray-400">
                        暂无行动项
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <hr className="my-6 border-gray-200" />

          {/* Other Matters */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">三、其他事项</h2>
            <div className="whitespace-pre-wrap text-gray-700">
              {meeting.others || '暂无内容'}
            </div>
          </div>

          <hr className="my-6 border-gray-200" />

          {/* Signatures */}
          <div className="flex justify-between mt-8 pt-4">
            <div className="text-center">
              <div className="w-32 border-b-2 border-gray-400 mb-2"></div>
              <div className="text-gray-600">记录人签字</div>
            </div>
            <div className="text-center">
              <div className="w-32 border-b-2 border-gray-400 mb-2"></div>
              <div className="text-gray-600">审核人签字</div>
            </div>
            <div className="text-center">
              <div className="w-32 border-b-2 border-gray-400 mb-2"></div>
              <div className="text-gray-600">记录日期</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MeetingPreview;
