---
name: 3d-scroll-website
description: スクロールに同期して連番画像（動画のコマ）を1枚ずつ表示する“奥行きのある”スクロールLPを作る。AI動画→連番JPGに分解した素材から、1ファイル完結のHTML/CSS/JSを生成する。Use when the user wants a scroll-driven image sequence (frame scrubbing) landing page, a "3D scroll" site like Apple product pages, or to turn a folder of sequential frames into a scroll experience.
---

# 3D スクロールLP（連番画像シーケンス）

スクロール量に応じて連番画像を1枚ずつ切り替え、動画をコマ送りするように見せる手法（Apple製品ページ型）でLPを作る。

## 前提・入力
- 連番画像のフォルダ（例: `frames/0001.jpg`, `0002.jpg`, …）。AI動画(mp4)を ffmpeg 等でJPG連番に分解したもの。
- 枚数が多いほど滑らか。目安は60〜150枚。重くなるので解像度と圧縮を最適化する。

## 作るもの
`assets/scroll-sequence-template.html` をベースに、1ファイル完結のLPを生成する。要点:
- 縦に長いスクロール領域（`.scene` の高さ＝コマ送りの速さ）＋画面に貼り付く `position: sticky` のcanvas。
- 全フレームを**プリロード**してから開始（カクつき防止）。読み込み中はローダー表示。
- スクロール進行度 `progress = -scene.top / (scene.height - innerHeight)` を 0〜1 にクランプし、`Math.round(progress*(FRAME_COUNT-1))` でフレーム番号に変換。
- 描画は `requestAnimationFrame` でスロットル。canvasは `devicePixelRatio`（最大2）で高精細化。画像は**cover**でフィット。
- 任意でスクロール進行度に応じたキャプション（テキスト）を出し入れ。

## 必ず守る品質要件
- **アクセシビリティ**: `prefers-reduced-motion: reduce` のユーザーには、スクロール乗っ取りをやめて**先頭フレームを静止表示**（テンプレは `.scene` を100vhにして対応済み）。
- **パフォーマンス**: フレーム枚数・解像度・JPG/WebP圧縮で軽量化。モバイルは枚数を抑えた軽量版を検討。
- **堅牢性**: 画像が一部読めなくても `onerror` で進行（テンプレ実装済み）。

## 生成手順
1. ユーザーに「連番画像の枚数」と「パスの形式（例: frames/0001.jpg）」を確認。
2. テンプレHTMLを複製し、スクリプト冒頭の設定だけ書き換える:
   - `FRAME_COUNT`（枚数）
   - `framePath(i)`（パスとゼロ埋め桁数）
   - `--frames-vh`（スクロール量。枚数や見せたい速さに合わせる。目安: 枚数×5〜6）
3. 見出し・キャプション文言、背景色などをブランドに合わせて調整。
4. ローカルで `npx serve` などで確認 → 公開。

## 注意
- 連番画像はそれ自体が重い。CDN配信や遅延読み込み（ファーストビュー優先）も検討。
- AI生成の画像・動画は各ツールの**商用利用規約**を確認する。
