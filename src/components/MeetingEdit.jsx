import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Eye, Mic, MicOff, Plus, Trash2, Sparkles, FileText, Wand2, Upload, Play, Pause, Volume2, X } from 'lucide-react';
import { storageService } from '../services/storage';
import { exportService } from '../services/export';
import { transformSpokenToFormal, extractActionItems, highlightHotelTerms } from '../services/transform';

function MeetingEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  
  // 语音输入状态
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [spokenText, setSpokenText] = useState('');
  const [transformedData, setTransformedData] = useState(null);
  const [showTransformPanel, setShowTransformPanel] = useState(false);
  const recognitionRef = useRef(null);
  
  // 文件上传状态
  const [audioFile, setAudioFile] = useState(null);
  const [audioUrl, setAudioUrl] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const audioRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const data = storageService.getMeetingById(id);
    if (data) {
      setMeeting(data);
    } else {
      navigate('/');
    }
    
    // 初始化语音识别
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = 'zh-CN';
        
        rec.onresult = (event) => {
          let finalTranscript = '';
          let interimTranscript = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript + '。';
            } else {
              interimTranscript += transcript;
            }
          }
          
          setSpokenText(prev => prev + finalTranscript + interimTranscript);
        };
        
        rec.onerror = (event) => {
          console.error('语音识别错误:', event.error);
          setIsRecording(false);
        };
        
        rec.onend = () => {
          if (isRecording) {
            rec.start();
          }
        };
        
        recognitionRef.current = rec;
        setRecognition(rec);
      }
    }
  }, [id, navigate, isRecording]);
  
  // 开始录音
  const startRecording = () => {
    if (recognitionRef.current) {
      setIsRecording(true);
      recognitionRef.current.start();
    }
  };
  
  // 停止录音
  const stopRecording = () => {
    if (recognitionRef.current) {
      setIsRecording(false);
      recognitionRef.current.stop();
    }
  };
  
  // 智能转换
  const handleTransform = () => {
    if (!spokenText.trim()) {
      alert('请先输入或录制一些内容');
      return;
    }
    
    const result = transformSpokenToFormal(spokenText);
    setTransformedData(result);
    setShowTransformPanel(true);
  };
  
  // 应用转换结果
  const applyTransformResult = () => {
    if (!transformedData) return;
    
    // 更新部门汇报内容
    if (transformedData.structuredContent) {
      updateField('departmentReports', transformedData.structuredContent);
    }
    
    // 提取议题
    if (transformedData.keyPoints && transformedData.keyPoints.length > 0) {
      const newTopics = transformedData.keyPoints.slice(0, 3);
      setMeeting(prev => ({ ...prev, topics: newTopics }));
    }
    
    // 添加行动项
    if (transformedData.actionItems && transformedData.actionItems.length > 0) {
      const newActions = extractActionItems(transformedData.actionItems);
      setMeeting(prev => ({ ...prev, actions: [...(prev.actions || []), ...newActions] }));
    }
    
    // 保存原始文本
    updateField('rawText', (meeting.rawText || '') + '\n' + spokenText);
    
    alert('转换结果已应用！');
    setShowTransformPanel(false);
    setSpokenText('');
    setTransformedData(null);
  };
  
  // 处理文件上传
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAudioFile(file);
      setAudioUrl(url);
    }
  };
  
  // 播放/暂停音频
  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };
  
  // 音频播放结束
  const handleAudioEnded = () => {
    setIsPlaying(false);
  };
  
  // 开始转录音频
  const startTranscribe = async () => {
    if (!audioFile) {
      alert('请先选择音频文件');
      return;
    }
    
    setTranscribing(true);
    
    try {
      // 使用音频播放+语音识别的方式进行转录
      if (audioRef.current && recognitionRef.current) {
        audioRef.current.currentTime = 0;
        
        // 清除之前的文本
        setSpokenText('');
        
        // 开始识别
        setIsRecording(true);
        recognitionRef.current.start();
        
        // 播放音频
        audioRef.current.play();
        setIsPlaying(true);
        
        // 监听音频结束
        audioRef.current.onended = () => {
          recognitionRef.current.stop();
          setIsRecording(false);
          setIsPlaying(false);
          setTranscribing(false);
        };
      }
    } catch (error) {
      console.error('转录失败:', error);
      setTranscribing(false);
      alert('转录失败，请重试');
    }
  };
  
  // 清除上传的文件
  const clearAudioFile = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioFile(null);
    setAudioUrl('');
    setIsPlaying(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const saveMeeting = async () => {
    setIsSaving(true);
    storageService.saveMeeting(meeting);
    setTimeout(() => {
      setIsSaving(false);
      alert('保存成功！');
    }, 300);
  };

  const updateField = (field, value) => {
    setMeeting(prev => ({ ...prev, [field]: value }));
  };

  const updateTopic = (index, value) => {
    const newTopics = [...(meeting.topics || [])];
    newTopics[index] = value;
    setMeeting(prev => ({ ...prev, topics: newTopics }));
  };

  const addTopic = () => {
    setMeeting(prev => ({ ...prev, topics: [...(prev.topics || []), ''] }));
  };

  const removeTopic = (index) => {
    setMeeting(prev => ({ ...prev, topics: (prev.topics || []).filter((_, i) => i !== index) }));
  };

  const addAction = () => {
    setMeeting(prev => ({
      ...prev,
      actions: [...(prev.actions || []), { id: Date.now().toString(), content: '', responsible: '', deadline: '', standard: '', remark: '' }]
    }));
  };

  const updateAction = (index, field, value) => {
    const newActions = [...(meeting.actions || [])];
    newActions[index] = { ...newActions[index], [field]: value };
    setMeeting(prev => ({ ...prev, actions: newActions }));
  };

  const removeAction = (index) => {
    setMeeting(prev => ({ ...prev, actions: (prev.actions || []).filter((_, i) => i !== index) }));
  };

  if (!meeting) return null;

  const tabs = [
    { id: 'basic', label: '基本信息' },
    { id: 'content', label: '会议内容' },
    { id: 'actions', label: '行动项' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-lg font-semibold text-gray-800">{meeting.title || '编辑会议记录'}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/meeting/${id}/preview`)}
              className="px-4 py-2 text-primary hover:bg-blue-50 rounded-lg font-medium flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              预览
            </button>
            <button
              onClick={saveMeeting}
              disabled={isSaving}
              className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              保存
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4">
        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white p-1 rounded-xl shadow-sm">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          {activeTab === 'basic' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">会议名称</label>
                  <input
                    type="text"
                    value={meeting.title}
                    onChange={(e) => updateField('title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">会议编号</label>
                  <input
                    type="text"
                    value={meeting.number}
                    disabled
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">会议日期</label>
                  <input
                    type="date"
                    value={meeting.date}
                    onChange={(e) => updateField('date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">开始时间</label>
                  <input
                    type="time"
                    value={meeting.startTime}
                    onChange={(e) => updateField('startTime', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">结束时间</label>
                  <input
                    type="time"
                    value={meeting.endTime}
                    onChange={(e) => updateField('endTime', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">会议地点</label>
                <input
                  type="text"
                  value={meeting.location}
                  onChange={(e) => updateField('location', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="例如：行政楼三楼会议室A"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">主持人</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={meeting.host}
                      onChange={(e) => updateField('host', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="姓名"
                    />
                    <input
                      type="text"
                      value={meeting.hostTitle}
                      onChange={(e) => updateField('hostTitle', e.target.value)}
                      className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="职务"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">记录人</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={meeting.recorder}
                      onChange={(e) => updateField('recorder', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="姓名"
                    />
                    <input
                      type="text"
                      value={meeting.recorderTitle}
                      onChange={(e) => updateField('recorderTitle', e.target.value)}
                      className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="职务"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">参会人员</label>
                <textarea
                  value={meeting.attendees}
                  onChange={(e) => updateField('attendees', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="列出所有实际到会人员姓名、部门及职务"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">缺席人员</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    value={meeting.absentees}
                    onChange={(e) => updateField('absentees', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="姓名、部门/职务"
                  />
                  <input
                    type="text"
                    value={meeting.absenteeReason}
                    onChange={(e) => updateField('absenteeReason', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="缺席原因"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">会议议题</label>
                <div className="space-y-2">
                  {(meeting.topics || []).map((topic, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={topic}
                        onChange={(e) => updateTopic(index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder={`议题 ${index + 1}`}
                      />
                      {(meeting.topics || []).length > 1 && (
                        <button
                          onClick={() => removeTopic(index)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  onClick={addTopic}
                  className="mt-2 text-primary hover:text-primary-dark font-medium flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  添加议题
                </button>
              </div>
            </div>
          )}

          {activeTab === 'content' && (
            <div className="space-y-6">
              {/* 智能输入区域 */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                <div className="flex items-center gap-3 mb-4">
                  <Sparkles className="w-6 h-6 text-primary" />
                  <h3 className="text-lg font-semibold text-gray-800">智能语音输入</h3>
                </div>
                
                <div className="space-y-4">
                  {/* 输入方式切换 */}
                  <div className="flex gap-2 bg-white p-1 rounded-lg border">
                    <button
                      onClick={() => {
                        clearAudioFile();
                      }}
                      className={`flex-1 py-2 px-4 rounded-md font-medium text-sm transition-all ${
                        !audioFile ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      🎤 实时录音
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className={`flex-1 py-2 px-4 rounded-md font-medium text-sm transition-all ${
                        audioFile ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      📁 上传文件
                    </button>
                  </div>
                  
                  {/* 文件上传区域 */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*,video/mp4"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  
                  {/* 音频播放器 */}
                  {audioFile && (
                    <div className="bg-white rounded-lg p-4 border shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center">
                            <Volume2 className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800 truncate max-w-xs">
                              {audioFile.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {(audioFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={clearAudioFile}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                      
                      {/* 音频元素 */}
                      <audio
                        ref={audioRef}
                        src={audioUrl}
                        onEnded={handleAudioEnded}
                        className="w-full mb-3"
                        controls
                      />
                      
                      {/* 转录控制 */}
                      <div className="flex gap-3">
                        <button
                          onClick={startTranscribe}
                          disabled={transcribing || isRecording}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-medium hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                          {transcribing ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              转录中...
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4" />
                              开始转录
                            </>
                          )}
                        </button>
                      </div>
                      
                      <p className="text-xs text-gray-500 mt-2">
                        💡 提示：转录时会播放音频并同时进行语音识别，请确保您的扬声器和麦克风都正常工作
                      </p>
                    </div>
                  )}
                  
                  {/* 实时录音控制 */}
                  {!audioFile && (
                    <div className="flex items-center gap-4">
                      <button
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                          isRecording
                            ? 'bg-red-500 text-white hover:bg-red-600 animate-pulse'
                            : 'bg-primary text-white hover:bg-primary-dark'
                        }`}
                      >
                        {isRecording ? (
                          <>
                            <MicOff className="w-5 h-5" />
                            停止录音
                          </>
                        ) : (
                          <>
                            <Mic className="w-5 h-5" />
                            开始录音
                          </>
                        )}
                      </button>
                    </div>
                  )}
                  
                  {/* 控制按钮 */}
                  <div className="flex items-center gap-4">
                    <button
                      onClick={handleTransform}
                      disabled={!spokenText.trim()}
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl font-medium hover:from-purple-600 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <Wand2 className="w-5 h-5" />
                      智能转换
                    </button>
                    
                    {spokenText && (
                      <button
                        onClick={() => {
                          setSpokenText('');
                          setTransformedData(null);
                          setShowTransformPanel(false);
                        }}
                        className="flex items-center gap-2 px-4 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl font-medium transition-all"
                      >
                        清空
                      </button>
                    )}
                  </div>
                  
                  {/* 语音输入文本框 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      原始输入（口语化文字）
                    </label>
                    <textarea
                      value={spokenText}
                      onChange={(e) => setSpokenText(e.target.value)}
                      rows={6}
                      className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-blue-100 text-sm"
                      placeholder="点击上方'开始录音'按钮，或直接粘贴口语化的会议内容..."
                    />
                  </div>
                </div>
              </div>
              
              {/* 转换结果面板 */}
              {showTransformPanel && transformedData && (
                <div className="bg-green-50 rounded-xl p-6 border border-green-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Sparkles className="w-6 h-6 text-green-600" />
                      <h3 className="text-lg font-semibold text-green-800">转换结果预览</h3>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowTransformPanel(false)}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                      >
                        取消
                      </button>
                      <button
                        onClick={applyTransformResult}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
                      >
                        应用到会议记录
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 原始文字 */}
                    <div className="bg-white rounded-lg p-4 border">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">原始输入</h4>
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">{transformedData.rawText}</p>
                    </div>
                    
                    {/* 转换后文字 */}
                    <div className="bg-white rounded-lg p-4 border">
                      <h4 className="text-sm font-medium text-green-700 mb-2">转换后</h4>
                      <p 
                        className="text-sm text-gray-800 whitespace-pre-wrap"
                        dangerouslySetInnerHTML={{ __html: highlightHotelTerms(transformedData.formalText) }}
                      />
                    </div>
                  </div>
                  
                  {/* 提取的信息 */}
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {transformedData.departments && transformedData.departments.length > 0 && (
                      <div className="bg-white rounded-lg p-4 border">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">🏢 涉及部门</h4>
                        <div className="flex flex-wrap gap-2">
                          {transformedData.departments.map((dept, idx) => (
                            <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">{dept}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {transformedData.actionItems && transformedData.actionItems.length > 0 && (
                      <div className="bg-white rounded-lg p-4 border">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">✅ 行动项（{transformedData.actionItems.length}个）</h4>
                        <ul className="text-xs text-gray-600 space-y-1">
                          {transformedData.actionItems.slice(0, 3).map((item, idx) => (
                            <li key={idx} className="truncate">• {item}</li>
                          ))}
                          {transformedData.actionItems.length > 3 && <li>• ...还有{transformedData.actionItems.length - 3}个</li>}
                        </ul>
                      </div>
                    )}
                    
                    {transformedData.keyPoints && transformedData.keyPoints.length > 0 && (
                      <div className="bg-white rounded-lg p-4 border">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">📌 关键要点</h4>
                        <ul className="text-xs text-gray-600 space-y-1">
                          {transformedData.keyPoints.slice(0, 3).map((point, idx) => (
                            <li key={idx} className="truncate">• {point}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* 传统编辑区域 */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">详细编辑</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">各部门工作汇报</label>
                    <textarea
                      value={meeting.departmentReports}
                      onChange={(e) => updateField('departmentReports', e.target.value)}
                      rows={10}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                      placeholder="- [部门名称]：[汇报人姓名] [职务]&#10;  汇报要点：&#10;  - [要点1]&#10;  - [要点2]&#10;  存在问题：&#10;  - [问题1]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">议题讨论与决议</label>
                    <textarea
                      value={meeting.discussions}
                      onChange={(e) => updateField('discussions', e.target.value)}
                      rows={12}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                      placeholder="**议题一：[议题名称]**&#10;- 讨论过程：[概括各方主要观点和讨论焦点]&#10;- 会议决议：[明确达成的共识和决定]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">其他事项</label>
                    <textarea
                      value={meeting.others}
                      onChange={(e) => updateField('others', e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="其他需要记录的事项，或下次会议安排"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'actions' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-gray-700">行动项清单</label>
                <button
                  onClick={addAction}
                  className="text-primary hover:text-primary-dark font-medium flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  添加行动项
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-2 text-sm font-medium text-gray-700 w-8">序号</th>
                      <th className="text-left py-2 px-2 text-sm font-medium text-gray-700">任务内容</th>
                      <th className="text-left py-2 px-2 text-sm font-medium text-gray-700 w-32">责任部门/人</th>
                      <th className="text-left py-2 px-2 text-sm font-medium text-gray-700 w-28">完成时限</th>
                      <th className="text-left py-2 px-2 text-sm font-medium text-gray-700">验收标准</th>
                      <th className="text-left py-2 px-2 text-sm font-medium text-gray-700 w-24">备注</th>
                      <th className="text-left py-2 px-2 text-sm font-medium text-gray-700 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {(meeting.actions || []).map((action, index) => (
                      <tr key={action.id} className="border-b border-gray-100">
                        <td className="py-2 px-2 text-gray-500">{index + 1}</td>
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            value={action.content}
                            onChange={(e) => updateAction(index, 'content', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            value={action.responsible}
                            onChange={(e) => updateAction(index, 'responsible', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="date"
                            value={action.deadline}
                            onChange={(e) => updateAction(index, 'deadline', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            value={action.standard}
                            onChange={(e) => updateAction(index, 'standard', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            value={action.remark}
                            onChange={(e) => updateAction(index, 'remark', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <button
                            onClick={() => removeAction(index)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {(meeting.actions || []).length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  暂无行动项，点击上方"添加行动项"按钮添加
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MeetingEdit;
