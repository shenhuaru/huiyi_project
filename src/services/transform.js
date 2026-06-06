/**
 * 智能文字转换服务
 * 将口语化的会议内容转换成符合酒店会议规范的书面表达
 */

// 酒店行业常用术语库
const HOTEL_TERMS = {
  '开房率': '出租率',
  '住房率': '出租率',
  '平均房价': 'ADR',
  '每房收益': 'RevPAR',
  '携程': 'OTA平台',
  '美团': 'OTA平台',
  '飞猪': 'OTA平台',
  '餐厅': '餐饮部',
  '客房': '客房部',
  '前台': '前厅部',
  '工程': '工程部',
  '保安': '安保部',
  '人事': '人力资源部',
  '财务': '财务部',
  '销售': '销售部',
  '老板': '总经理',
  '经理': '部门经理',
  '员工': '同事',
  '大家': '各位同事',
  '好的': '同意',
  '没问题': '同意',
  '可以': '同意',
  '行': '同意',
  '嗯': '同意',
  '哦': '了解',
  '那个': '该事项',
  '这个': '该事项',
  '然后': '此外',
  '还有': '此外',
  '就是说': '即',
  '比如说': '例如',
  '大概': '约',
  '差不多': '接近',
  '可能': '预计',
  '应该': '建议',
  '必须': '务必',
  '要': '需要',
  '得': '需要',
  '搞定': '完成',
  '弄好': '完成',
  '做好': '完成',
  '赶紧': '尽快',
  '快点': '尽快',
  '马上': '立即',
  '等一下': '稍后',
  '等等': '等',
  '对吧': '对吗',
  '是吧': '是吗',
  '呢': '',
  '啊': '',
  '呀': '',
  '啦': '',
  '吧': '',
  '嘛': '',
  '哈': '',
  '哦': '',
  '嗯': '',
  '呃': '',
  '那个': '',
  '这个': '',
  '就是': '即',
};

// 口语化表达替换规则
const SPOKEN_REPLACEMENTS = [
  // 语气词和填充词
  { regex: /那个/g, replace: '' },
  { regex: /这个/g, replace: '' },
  { regex: /就是说/g, replace: '即' },
  { regex: /比如说/g, replace: '例如' },
  { regex: /然后/g, replace: '此外' },
  { regex: /还有/g, replace: '此外' },
  { regex: /反正/g, replace: '总之' },
  { regex: /其实/g, replace: '' },
  { regex: /真的/g, replace: '' },
  { regex: /非常/g, replace: '十分' },
  { regex: /特别/g, replace: '十分' },
  { regex: /超级/g, replace: '极其' },
  
  // 动词替换
  { regex: /搞定/g, replace: '完成' },
  { regex: /弄好/g, replace: '完成' },
  { regex: /做好/g, replace: '完成' },
  { regex: /弄完/g, replace: '完成' },
  { regex: /赶紧/g, replace: '尽快' },
  { regex: /快点/g, replace: '尽快' },
  { regex: /马上/g, replace: '立即' },
  { regex: /要/g, replace: '需要' },
  { regex: /得/g, replace: '需要' },
  { regex: /必须/g, replace: '务必' },
  { regex: /应该/g, replace: '建议' },
  
  // 称呼替换
  { regex: /老板/g, replace: '总经理' },
  { regex: /大家/g, replace: '各位同事' },
  { regex: /同志们/g, replace: '各位同事' },
  
  // 数字转换
  { regex: /一百/g, replace: '100' },
  { regex: /两百/g, replace: '200' },
  { regex: /三百/g, replace: '300' },
  { regex: /四百/g, replace: '400' },
  { regex: /五百/g, replace: '500' },
  { regex: /六百/g, replace: '600' },
  { regex: /七百/g, replace: '700' },
  { regex: /八百/g, replace: '800' },
  { regex: /九百/g, replace: '900' },
  { regex: /一千/g, replace: '1000' },
  
  // 酒店术语
  { regex: /开房率/g, replace: '出租率' },
  { regex: /住房率/g, replace: '出租率' },
  { regex: /平均房价/g, replace: 'ADR' },
  { regex: /每房收益/g, replace: 'RevPAR' },
  { regex: /携程/g, replace: 'OTA平台' },
  { regex: /美团/g, replace: 'OTA平台' },
  { regex: /飞猪/g, replace: 'OTA平台' },
  { regex: /餐厅/g, replace: '餐饮部' },
  { regex: /客房/g, replace: '客房部' },
  { regex: /前台/g, replace: '前厅部' },
  { regex: /工程/g, replace: '工程部' },
  { regex: /保安/g, replace: '安保部' },
  { regex: /人事/g, replace: '人力资源部' },
  { regex: /财务/g, replace: '财务部' },
  { regex: /销售/g, replace: '销售部' },
  
  // 句子结尾优化
  { regex: /吧[。！？]/g, replace: '。' },
  { regex: /啊[。！？]/g, replace: '。' },
  { regex: /呀[。！？]/g, replace: '。' },
  { regex: /啦[。！？]/g, replace: '。' },
  { regex: /呢[。！？]/g, replace: '？' },
  { regex: /哈[。！？]/g, replace: '。' },
];

// 提取会议要素的正则表达式
const PATTERNS = {
  speaker: /^(我|我们|我想|我说|我觉得|我认为|我的意见是|我提一下|我建议|我想说)/gm,
  actionItem: /(要|需要|必须|得|应该|建议|尽快|马上|立即).*?(做|完成|处理|落实|跟进|解决|安排|准备|检查|维修)/g,
  person: /(张|王|李|赵|刘|陈|杨|黄|周|吴|徐|孙|马|朱|胡|郭|何|高|林|罗|郑|梁|谢|宋|唐|许|邓|冯|韩|曹|曾|彭|萧|蔡|潘|田|董|袁|于|余|叶|蒋|杜|苏|魏|程|吕|丁|沈|任|姚|卢|傅|钟|姜|崔|谭|廖|范|汪|陆|金|石|戴|贾|韦|夏|邱|方|侯|邹|熊|孟|秦|白|江|阎|薛|尹|段|雷|黎|史|龙|贺|顾|毛|郝|龚|邵|万|钱|严|覃|武|戚|明|华|伟|萍|芳|娜|敏|静|丽|强|军|杰|涛|勇|明|超|秀|娟|英|慧|莉|霞|平|刚|桂|文|玲|芳|燕|艳|婷|玉|萍|红|梅)[\u4e00-\u9fa5]{1,2}/g,
  department: /(客房|前厅|餐饮|工程|安保|人力|财务|销售|市场|采购|行政|总办)/g,
  time: /(今天|明天|后天|本周|下周|本月|下月|年底|年初|月底|月初|周[一二三四五六日]|星期[一二三四五六日]|\\d+月\\d+号|\\d+月\\d+日)/g,
  number: /\d+(\.\d+)?(％|%|百|千|万|亿|间|房|人|次|元|块|天|周|月|年)/g,
};

/**
 * 智能转换函数
 * @param {string} text - 原始口语化文字
 * @returns {Object} 转换后的结构化数据
 */
export function transformSpokenToFormal(text) {
  if (!text || text.trim() === '') {
    return {
      rawText: text,
      formalText: '',
      speakers: [],
      actionItems: [],
      departments: [],
      keyPoints: [],
    };
  }

  let formalText = text;

  // 应用替换规则
  SPOKEN_REPLACEMENTS.forEach(({ regex, replace }) => {
    formalText = formalText.replace(regex, replace);
  });

  // 清理多余空格
  formalText = formalText.replace(/\s+/g, ' ').trim();
  
  // 清理多余的标点符号
  formalText = formalText.replace(/。。+/g, '。');
  formalText = formalText.replace(/，，+/g, '，');
  formalText = formalText.replace(/！！+/g, '！');
  formalText = formalText.replace(/？？+/g, '？');

  // 提取发言人
  const speakers = [];
  let speakerMatch;
  while ((speakerMatch = PATTERNS.speaker.exec(text)) !== null) {
    const speaker = speakerMatch[0];
    if (!speakers.includes(speaker)) {
      speakers.push(speaker);
    }
  }

  // 提取行动项
  const actionItems = [];
  let actionMatch;
  const actionSentences = text.split(/[。！？；\n]+/).filter(s => s.trim());
  actionSentences.forEach(sentence => {
    if (/(要|需要|必须|得|应该|建议|尽快|马上|立即).*?(做|完成|处理|落实|跟进|解决|安排|准备|检查|维修|整改|优化|提升)/.test(sentence)) {
      actionItems.push(sentence.trim());
    }
  });

  // 提取部门
  const departments = [];
  let deptMatch;
  while ((deptMatch = PATTERNS.department.exec(text)) !== null) {
    const dept = deptMatch[0];
    const fullDept = dept.endsWith('部') ? dept : dept + '部';
    if (!departments.includes(fullDept)) {
      departments.push(fullDept);
    }
  }

  // 提取关键点
  const keyPoints = [];
  const sentences = formalText.split(/[。！？；\n]+/).filter(s => s.trim());
  sentences.forEach(sentence => {
    if (sentence.length > 10 && sentence.length < 100) {
      // 包含数字、术语或关键词的句子作为关键点
      if (/\d+/.test(sentence) || /(出租率|ADR|RevPAR|OTA|GOP|营收|成本|利润|预算|指标|目标)/.test(sentence)) {
        keyPoints.push(sentence.trim());
      }
    }
  });

  // 生成结构化的会议内容
  const structuredContent = generateStructuredContent(formalText, departments, actionItems, keyPoints);

  return {
    rawText: text,
    formalText: formalText,
    speakers,
    actionItems,
    departments,
    keyPoints,
    structuredContent,
  };
}

/**
 * 生成结构化内容
 */
function generateStructuredContent(formalText, departments, actionItems, keyPoints) {
  let content = '';

  // 部门工作汇报部分
  if (departments.length > 0) {
    departments.forEach(dept => {
      content += `- ${dept}：\n`;
      content += `  汇报要点：\n`;
      if (keyPoints.length > 0) {
        keyPoints.slice(0, 3).forEach(point => {
          content += `  - ${point}\n`;
        });
      }
      content += `  存在问题：\n`;
      content += `  - 待补充\n\n`;
    });
  } else {
    content += `- 各部门：\n`;
    content += `  汇报要点：\n`;
    if (keyPoints.length > 0) {
      keyPoints.forEach(point => {
        content += `  - ${point}\n`;
      });
    }
    content += `  存在问题：\n`;
    content += `  - 待补充\n\n`;
  }

  // 议题讨论与决议
  content += `议题讨论与决议：\n`;
  const sentences = formalText.split(/[。！？；\n]+/).filter(s => s.trim());
  if (sentences.length > 0) {
    content += `- 讨论过程：\n`;
    sentences.slice(0, 5).forEach(s => {
      content += `  ${s}。\n`;
    });
    content += `- 会议决议：\n`;
    content += `  同意以上讨论内容。\n`;
  }

  return content;
}

/**
 * 高亮酒店术语
 */
export function highlightHotelTerms(text) {
  let highlighted = text;
  
  Object.keys(HOTEL_TERMS).forEach(term => {
    const regex = new RegExp(term, 'g');
    highlighted = highlighted.replace(regex, `<mark class="bg-yellow-100 text-yellow-800 px-1 rounded">${HOTEL_TERMS[term]}</mark>`);
  });
  
  // 高亮数字和指标
  highlighted = highlighted.replace(/\d+(\.\d+)?(％|%|百|千|万|亿|间|房|人|次|元|块|天|周|月|年)/g, 
    '<span class="text-primary font-semibold">$&</span>');
  
  return highlighted;
}

/**
 * 导出行动项对象数组
 */
export function extractActionItems(actionItems) {
  return actionItems.map((item, index) => ({
    id: Date.now() + '-' + index,
    content: item,
    responsible: '',
    deadline: '',
    standard: '',
    remark: '',
  }));
}
