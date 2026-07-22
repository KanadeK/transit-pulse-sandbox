# Transit Pulse Sandbox（班次脉冲沙盒）

`v0.1.0` 是一个可离线复现的公共交通可靠性实验工具：用轻量离散事件仿真展示班距、拥挤、等待、容量、延误与能耗代理指标之间的权衡。

![Transit Pulse Sandbox 界面](docs/assets/sandbox.png)

- 以相同固定随机种子比较不同班距。
- 注入需求高峰或车辆故障，观察队列、准点率和拥挤度变化。
- 导入本地 JSON 线路；浏览器不会上传数据。

```bash
npm ci
npm run dev
```

内置 6 站合成公交线与 12 站合成轨道线，均随仓库发布且不含真实运营或乘客数据。地图和延误时间序列分别使用 MapLibre 与 D3；计算在 Web Worker 中调用同一份领域核心完成。

## 快速试验

调节班距和容量后点击“Run baseline”；或点击“Inject peak”“Inject vehicle fault”。指标来自实际仿真结果，包括平均等待、拥挤比例、准点率、能耗代理、上不了车的乘客和发车次数，不是固定展示数值。

```bash
npm run demo
```

此命令以固定 seed `20260722` 对 12 站轨道样例执行高峰场景，在 `dist-release/demo-report.json` 输出真实的基线及 6/8/12 分钟策略比较。

## 验证与打包

```bash
npm run lint && npm run typecheck && npm run test:coverage && npm run test:e2e && npm run build
npm run package
make verify
make demo
make package
make release-check
```

没有 `make` 时可直接使用相应的 `npm run` 命令。发布物会写入 `dist-release/`，并附 SHA256。`release-check` 会校验工作区、版本、提交作者、测试、构建、未完成标记和常见密钥痕迹。

## 隐私、安全与边界

应用无遥测、无登录、无远程 API、无远程地图瓦片。导入文件只在本地浏览器解析。能耗为策略比较用代理指标，并非物理能耗或客流预测。更多信息见 [隐私与安全说明](docs/PRIVACY_AND_SECURITY.md)。

## 贡献与差异化

请阅读 [贡献指南](CONTRIBUTING.md)。[公开仓库抽样检索](docs/COMPETITOR_SCAN.md) 未发现同名且高度同构的活跃项目；本项目保持可解释、离线、合成数据与固定 seed 的单线路可靠性实验定位，而非实时调度或完整客流分配系统。
