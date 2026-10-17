/**
 * E01 数字人课程示例数据（S1 可操作演示，非真实数字人讲师）。
 *
 * 参照 OpenDesign 原型「04 数字人课程」，但为单套结构；A/B 主题共用同一份数据与 DOM。
 * 讲师形象、声线都尚未真实接入，界面必须如实标注为示例。
 *
 * @typedef {object} CourseTeacher
 * @property {string} name
 * @property {string} desc
 * @property {string} voice
 * @property {string} avatar
 *
 * @typedef {object} CourseBoard
 * @property {string} tone
 * @property {string} image
 * @property {string} imageAlt
 * @property {{ left: string, top: string, label: string }} pin
 *
 * @typedef {object} CourseFixture
 * @property {{ level: string, notice: string }} demo
 * @property {string} title
 * @property {string} sub
 * @property {string} progressLabel
 * @property {CourseBoard} board
 * @property {CourseTeacher} presenter
 * @property {CourseTeacher[]} teachers
 * @property {string[]} outline
 * @property {string} prevLabel
 * @property {string} nextLabel
 */

/** @type {CourseFixture} */
export const courseFixture = {
  demo: {
    level: 'S1',
    notice: 'E01 数字人课程：示例演示页，讲师形象与语音尚未真实接入，内容为示例。',
  },
  title: '手机拍好照 · 第 3 讲',
  sub: '构图：把想拍的东西放对位置',
  progressLabel: '已学 3/8 讲',
  board: {
    tone: 'calm',
    image: 'art-taichi.jpg',
    imageAlt: '教学示范图：公园里的人物构图',
    pin: { left: '31%', top: '44%', label: '人物放在交叉点' },
  },
  presenter: { name: '邻家阿妹', desc: '温柔细讲 · 语速慢', voice: '女声 · 慢', avatar: '妹' },
  teachers: [
    { name: '邻家阿妹', desc: '温柔细讲', voice: '女声 · 慢', avatar: '妹' },
    { name: '茶馆先生', desc: '慢条斯理', voice: '男声 · 中', avatar: '茶' },
    { name: '开心大姐', desc: '说笑教学', voice: '女声 · 快', avatar: '俏' },
  ],
  outline: ['三分法：把画面切成九宫格', '把人放在交叉点上', '留一点“走路的方向”', '动手拍一张试试'],
  prevLabel: '‹ 上一节',
  nextLabel: '下一节 ›',
};
