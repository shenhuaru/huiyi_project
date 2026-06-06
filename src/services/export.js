export const exportService = {
  exportToMarkdown(meeting) {
    let content = `# 【酒店会议记录】\n\n`;
    content += `会议名称：${meeting.title || ''}\n`;
    content += `会议编号：${meeting.number || ''}\n`;
    content += `会议时间：${meeting.date || ''} ${meeting.startTime || ''} - ${meeting.endTime || ''}\n`;
    content += `会议地点：${meeting.location || ''}\n`;
    content += `主持人：${meeting.host || ''} ${meeting.hostTitle || ''}\n`;
    content += `记录人：${meeting.recorder || ''} ${meeting.recorderTitle || ''}\n`;
    content += `参会人员：${meeting.attendees || ''}\n`;
    content += `缺席人员：${meeting.absentees || ''}\n`;
    if (meeting.absenteeReason) {
      content += `，缺席原因：${meeting.absenteeReason}\n`;
    }
    content += `会议议题：\n`;
    (meeting.topics || []).forEach((topic, index) => {
      content += `${index + 1}. ${topic}\n`;
    });

    content += `\n---\n\n`;
    content += `## 一、会议主要内容\n\n`;
    content += `### 1.1 各部门工作汇报\n\n`;
    content += meeting.departmentReports || '';
    content += `\n\n### 1.2 议题讨论与决议\n\n`;
    content += meeting.discussions || '';

    content += `\n---\n\n`;
    content += `## 二、行动项清单\n\n`;
    content += `| 序号 | 任务内容 | 责任部门/人 | 完成时限 | 验收标准 | 备注 |\n`;
    content += `|------|----------|-------------|----------|----------|------|\n`;
    (meeting.actions || []).forEach((action, index) => {
      content += `| ${index + 1} | ${action.content || ''} | ${action.responsible || ''} | ${action.deadline || ''} | ${action.standard || ''} | ${action.remark || ''} |\n`;
    });

    content += `\n---\n\n`;
    content += `## 三、其他事项\n\n`;
    content += meeting.others || '';

    content += `\n\n---\n\n`;
    content += `**记录人签字**：__________  **审核人签字**：__________\n`;
    content += `**记录日期**：${meeting.date || ''}\n`;

    return content;
  },

  downloadFile(content, filename, type = 'text/plain') {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
};
