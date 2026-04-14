# Core Beliefs

## 1. Copy-own distribution
Artifacts được copy trực tiếp vào project — không phải runtime dependency.
User owns them hoàn toàn, có thể edit thoải mái. Mỗi artifact phải
standalone và readable mà không cần harness-kit installed.

## 2. Just enough — không hơn
Mỗi artifact thêm vào là chi phí context window. ~40% context utilization
là ngưỡng agent bắt đầu degraded. Default preset phải fit well under that.
Mỗi module thêm vào phải justify cost của nó.

## 3. Repository as system of record
Mọi quyết định kiến trúc, product direction, và convention phải live
trong repo. Nếu agent không đọc được, nó không tồn tại. Không có
"tribal knowledge" — encode vào docs hoặc code.

## 4. Boring tech wins
Lib phổ biến, API stable, well-represented in training data → agent model
được tốt hơn. Ưu tiên: commander > yargs, clack > inquirer, vitest > jest.
Tránh lib mới/obscure trừ khi có lý do rất mạnh.

## 5. Enforce mechanically, not documentally
Lint rules > documentation rules. Nếu một constraint quan trọng, encode
nó vào TypeScript types, linter, hoặc test — đừng chỉ viết vào docs.
