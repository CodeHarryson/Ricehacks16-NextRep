const fs = require('fs');
const path = require('path');
const { withDangerousMod, withXcodeProject, withPodfile, IOSConfig } = require('@expo/config-plugins');

const MODEL = 'pose_landmarker_lite.task';

function copyModel(config) {
  return withDangerousMod(config, ['ios', async (modConfig) => {
    const source = path.join(modConfig.modRequest.projectRoot, 'assets', MODEL);
    fs.copyFileSync(source, path.join(modConfig.modRequest.platformProjectRoot, MODEL));
    return modConfig;
  }]);
}

module.exports = function withPoseLandmarkerModel(config) {
  config = copyModel(config);
  config = withPodfile(config, (modConfig) => {
    const marker = '# NextRep deployment target normalization';
    if (!modConfig.modResults.contents.includes(marker)) {
      modConfig.modResults.contents = modConfig.modResults.contents.replace(/\n  end\nend\s*$/, `\n\n    ${marker}\n    installer.pods_project.targets.each do |target|\n      target.build_configurations.each do |build_config|\n        build_config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '15.1'\n      end\n    end\n  end\nend\n`);
    }
    return modConfig;
  });
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
