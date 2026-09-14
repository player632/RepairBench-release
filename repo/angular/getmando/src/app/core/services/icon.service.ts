import { Injectable } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

import { SelfhostedApp } from '../models/dashboard.models';

/**
 * Icon type options
 */
export type IconType = 'url' | 'name' | 'initials';

/**
 * Icon configuration
 */
export interface IconConfig {
  type: IconType;
  value: string;
}

/**
 * Service for handling application icons
 * Supports CDN icons, custom URLs, and generated SVG fallbacks
 */
@Injectable({ providedIn: 'root' })
export class IconService {
  private readonly sanitizer: DomSanitizer;

  // Base URLs for resolved icons.
  //
  // RepairBench adaptation (offline-ization; disclosed in task.toml [metadata].base_state and
  // meta.json.source_seed.adaptation - NO checkpoint targets this layer). Upstream points these
  // three bases at public CDNs:
  //   DASHBOARD_ICONS_CDN  https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png
  //   GOOGLE_ICONS_CDN     https://www.google.com/s2/favicons
  //   MATERIAL_ICONS_CDN   https://fonts.gstatic.com/s/i/materialicons
  // task.toml sets [environment].allow_internet = false, so with the upstream values every
  // application card would fire a cross-origin <img> request that can hang, 404 or change under
  // the measurement, which is exactly the non-determinism the offline rule exists to remove
  //
  // plus 14 local token fixtures). The three bases are therefore repointed at /img/icons, a
  // directory of local SVG fixtures that this same patch adds under public/img/icons/ - one per
  // icon `value` used by the mounted dashboard configuration. Everything else in this file is
  // untouched seed code: the name sanitisation, the cache key, the join that produces the final
  // path and the initials/default data-URL generators all still run, so the icon-resolution
  // surface stays measurable; only the origin it resolves against changed.
  private readonly DASHBOARD_ICONS_CDN = '/img/icons';
  private readonly GOOGLE_ICONS_CDN = '/img/icons';
  private readonly MATERIAL_ICONS_CDN = '/img/icons';

  // Icon cache
  private readonly iconCache = new Map<string, string>();

  constructor(sanitizer: DomSanitizer) {
    this.sanitizer = sanitizer;
  }

  /**
   * Get icon URL for an application
   * @param app - Selfhosted application
   * @returns Icon URL string
   */
  getIconUrl(app: SelfhostedApp): string {
    return this.getIconUrlFromConfig(app.icon, app.name);
  }

  /**
   * Get icon URL from configuration
   * @param iconConfig - Icon configuration
   * @param appName - Application name (for fallback)
   * @returns Icon URL string
   */
  getIconUrlFromConfig(iconConfig: IconConfig, appName: string): string {
    const cacheKey = `${iconConfig.type}-${iconConfig.value}`;

    // Check cache
    if (this.iconCache.has(cacheKey)) {
      return this.iconCache.get(cacheKey)!;
    }

    let url: string;

    switch (iconConfig.type) {
      case 'url':
        url = iconConfig.value;
        break;
      case 'name':
        url = this.getIconFromCDN(iconConfig.value);
        break;
      case 'initials':
        url = this.generateInitialsIcon(appName, iconConfig.value);
        break;
      default:
        url = this.generateInitialsIcon(appName);
    }

    // Cache and return
    this.iconCache.set(cacheKey, url);
    return url;
  }

  /**
   * Get icon as SafeUrl for Angular binding
   * @param app - Selfhosted application
   * @returns SafeUrl
   */
  getIconUrlSafe(app: SelfhostedApp): SafeUrl {
    return this.sanitizer.bypassSecurityTrustUrl(this.getIconUrl(app));
  }

  /**
   * Get icon from CDN by name
   * @param name - Icon/service name
   * @returns CDN URL
   */
  private getIconFromCDN(name: string): string {
    const sanitizedName = name.toLowerCase().replace(/\s+/g, '-');

    // Try Dashboard Icons CDN first
    // RepairBench adaptation: the local fixtures are SVG (text, so the patch that carries them
    // stays reviewable and byte-stable). Upstream asked the CDN for `.png`. The join shape, the
    // sanitisation and the cache are unchanged.
    return `${this.DASHBOARD_ICONS_CDN}/${sanitizedName}.svg`;
  }

  /**
   * Fallback to Google Favicon
   * @param url - Application URL
   * @returns Google Favicon URL
   */
  getGoogleFavicon(url: string): string {
    try {
      const domain = new URL(url).hostname;
      return `${this.GOOGLE_ICONS_CDN}?domain=${domain}&sz=128`;
    } catch {
      return this.generateDefaultIcon();
    }
  }

  /**
   * Generate SVG icon with initials
   * @param name - Application name
   * @param initials - Custom initials (optional)
   * @returns Data URL of SVG icon
   */
  private generateInitialsIcon(name: string, initials?: string): string {
    const displayInitials = initials || this.extractInitials(name);
    const backgroundColor = this.getColorFromString(name);

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
        <rect width="128" height="128" fill="${backgroundColor}" rx="24"/>
        <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="48" font-weight="bold"
              fill="white" text-anchor="middle" dominant-baseline="middle">
          ${displayInitials}
        </text>
      </svg>
    `;

    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }

  /**
   * Generate default icon
   * @returns Data URL of default SVG icon
   */
  private generateDefaultIcon(): string {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
        <rect width="128" height="128" fill="#6366f1" rx="24"/>
        <path d="M64 32c-17.673 0-32 14.327-32 32s14.327 32 32 32 32-14.327 32-32-14.327-32-32-32zm0 56c-13.255 0-24-10.745-24-24s10.745-24 24-24 24 10.745 24 24-10.745 24-24 24z" fill="white"/>
        <circle cx="64" cy="64" r="8" fill="white"/>
      </svg>
    `;

    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }

  /**
   * Extract initials from name
   * @param name - Application name
   * @returns Initials (max 2 characters)
   */
  private extractInitials(name: string): string {
    const words = name.trim().split(/\s+/);

    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }

    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  }

  /**
   * Generate consistent color from string
   * @param str - Input string
   * @returns HSL color string
   */
  private getColorFromString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }

    const h = Math.abs(hash % 360);
    const s = 70;
    const l = 55;

    return `hsl(${h}, ${s}%, ${l}%)`;
  }

  /**
   * Clear icon cache
   */
  clearCache(): void {
    this.iconCache.clear();
  }

  /**
   * Preload icon
   * @param url - Icon URL to preload
   * @returns Promise that resolves when image is loaded
   */
  preloadIcon(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => reject(new Error(`Failed to load icon: ${url}`));
      img.src = url;
    });
  }

  /**
   * Get icon as HTMLImageElement
   * @param app - Selfhosted application
   * @returns Promise<HTMLImageElement>
   */
  async getIconElement(app: SelfhostedApp): Promise<HTMLImageElement> {
    const url = this.getIconUrl(app);
    await this.preloadIcon(url);

    const img = document.createElement('img');
    img.src = url;
    img.alt = app.name;
    return img;
  }
}
