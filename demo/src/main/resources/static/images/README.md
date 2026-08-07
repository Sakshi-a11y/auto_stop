# Website images

Place or replace image files in this folder. The app loads them from `/images/...`.

| File | Used on | Recommended size |
|------|---------|------------------|
| `logo.png` | Navigation bar (all pages) | 128×128 px or square |
| `hero-truck.jpg` | Home page + login/register side panel | 1200×675 px (16:9) |
| `weighbridge-banner.jpg` | Owner & admin dashboard banner | 1200×675 px (16:9) |

## Replace with your own photos

1. Copy your image files into this folder using the **same filenames** above.
2. Hard refresh the browser: `Ctrl + Shift + R`.
3. If the app is running, restart Spring Boot or run `mvn resources:resources` from the `demo` folder.

Supported formats: `.jpg`, `.jpeg`, `.png`, `.webp`
