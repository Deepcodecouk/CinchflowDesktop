import fs from 'node:fs';
import path from 'node:path';
import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerDMG } from '@electron-forge/maker-dmg';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { VitePlugin } from '@electron-forge/plugin-vite';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { FuseV1Options, FuseVersion } from '@electron/fuses';
import { toDisplayVersion } from './src/shared/version';

/** Recursively copy a directory. */
function copyDirSync(src: string, dest: string): void {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

const nativeModules = ['better-sqlite3', 'bindings', 'file-uri-to-path'];
const packageJson = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, 'package.json'), 'utf8'),
) as {
  productName?: string;
  version: string;
};
const productName = packageJson.productName ?? 'CinchFlow';
const displayVersion = toDisplayVersion(packageJson.version);
const versionedExecutableName = `cinchflow-${displayVersion}`;
const versionedInstallerName = `${productName}-${displayVersion}-Setup.exe`;

const config: ForgeConfig = {
  packagerConfig: {
    asar: {
      unpack: '**/*.node',
    },
    name: 'CinchFlow',
    executableName: versionedExecutableName,
    appBundleId: 'com.cinchflow.desktop',
    appCategoryType: 'public.app-category.finance',
    // Uncomment when icon files are added:
    // icon: path.resolve(__dirname, 'assets/icon'),
  },
  rebuildConfig: {},
  hooks: {
    packageAfterCopy: async (_config, buildPath) => {
      const projectModules = path.resolve(__dirname, 'node_modules');
      const destModules = path.join(buildPath, 'node_modules');
      for (const mod of nativeModules) {
        const src = path.join(projectModules, mod);
        const dest = path.join(destModules, mod);
        if (fs.existsSync(src)) {
          copyDirSync(src, dest);
        }
      }
    },
  },
  makers: [
    new MakerSquirrel({
      name: 'CinchFlow',
      exe: `${versionedExecutableName}.exe`,
      setupExe: versionedInstallerName,
      // Uncomment when icon files are added:
      // setupIcon: path.resolve(__dirname, 'assets/icon.ico'),
      // iconUrl: 'https://raw.githubusercontent.com/.../icon.ico',
    }),
    new MakerDMG({
      name: productName,
      overwrite: true,
      title: `${productName} ${displayVersion}`,
      format: 'ULFO',
    }, ['darwin']),
    new MakerZIP({}, ['darwin']),
    new MakerDeb({
      options: {
        name: 'cinchflow',
        productName: 'CinchFlow',
        genericName: 'Personal Finance Manager',
        description: 'Personal finance budgeting and cashflow forecasting application',
        categories: ['Office', 'Finance'],
        // Uncomment when icon files are added:
        // icon: path.resolve(__dirname, 'assets/icon.png'),
      },
    }),
    new MakerRpm({
      options: {
        name: 'cinchflow',
        productName: 'CinchFlow',
        description: 'Personal finance budgeting and cashflow forecasting application',
        categories: ['Office', 'Finance'],
        // Uncomment when icon files are added:
        // icon: path.resolve(__dirname, 'assets/icon.png'),
      },
    }),
  ],
  plugins: [
    new VitePlugin({
      build: [
        {
          entry: 'src/main/index.ts',
          config: 'vite.main.config.ts',
          target: 'main',
        },
        {
          entry: 'src/preload/preload.ts',
          config: 'vite.preload.config.ts',
          target: 'preload',
        },
      ],
      renderer: [
        {
          name: 'main_window',
          config: 'vite.renderer.config.mts',
        },
      ],
    }),
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};

export default config;
