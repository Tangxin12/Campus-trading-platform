// 云函数入口文件
const cloud = require('wx-server-sdk')

// 初始化云环境（替换成你自己的环境ID）
cloud.init({
  env: 'cloud1-7gc4fmm813ecee0f' 
})

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    // 获取传入的文件ID
    const { fileID } = event;
    
    // 校验fileID是否为空
    if (!fileID) {
      return {
        success: false,
        message: 'fileID不能为空'
      };
    }
    
    // 获取临时文件链接
    const result = await cloud.getTempFileURL({
      fileList: [fileID], // 支持同时获取多个文件，这里先处理单个
    });
    
    // 返回临时链接
    return {
      success: true,
      tempFileURL: result.fileList[0].tempFileURL,
      errMsg: result.fileList[0].errMsg
    };
  } catch (err) {
    // 异常处理
    return {
      success: false,
      message: '获取临时链接失败',
      error: err.message
    };
  }
}