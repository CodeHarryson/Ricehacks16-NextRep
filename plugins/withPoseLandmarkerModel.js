const fs = require('fs');
const path = require('path');
const { withDangerousMod, withXcodeProject, IOSConfig } = require('@expo/config-plugins');

const MODEL = 'pose_landmarker_lite.task';

function copyModel(config, platform) {
  return withDangerousMod(config, [platform, async (modConfig) => {
    const source = path.join(modConfig.modRequest.projectRoot, 'assets', MODEL);
    const destination = platform === 'android'
      ? path.join(modConfig.modRequest.platformProjectRoot, 'app', 'src', 'main', 'assets', MODEL)
      : path.join(modConfig.modRequest.platformProjectRoot, modConfig.modRequest.projectName, MODEL);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(source, destination);
    return modConfig;
  }]);
}

module.exports = function withPoseLandmarkerModel(config) {
  config = copyModel(config, 'android');
  config = copyModel(config, 'ios');
  return withXcodeProject(config, (modConfig) => {
    const project = modConfig.modResults;
    const target = IOSConfig.XcodeUtils.getApplicationNativeTarget({ project, projectName: modConfig.modRequest.projectName });
    const relativePath = MODEL;
    if (!project.hasFile(relativePath)) IOSConfig.XcodeUtils.addResourceFileToGroup({
      filepath: relativePath,
      groupName: modConfig.modRequest.projectName,
      project,
      isBuildFile: true,
      targetUuid: target.uuid,
    });
    return modConfig;
  });
};
