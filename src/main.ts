import "./style.css";

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("アプリケーションの描画先が見つかりません。");
}

app.innerHTML = `
  <main class="app-shell">
    <header class="hero">
      <p class="eyebrow">GUGA / STUDY TOOL</p>
      <h1>生成AIパスポート<br />一問一答</h1>
      <p class="lead">
        生成AIパスポート試験の学習を支援する、静的Webアプリケーションです。
      </p>
    </header>

    <section class="notice" aria-labelledby="notice-title">
      <h2 id="notice-title">準備中</h2>
      <p>
        現在は公開基盤を構築しています。次のフェーズで問題データと演習機能を追加します。
      </p>
      <p class="notice-detail">
        本アプリはGUGA主催の生成AIパスポート試験を対象としています。
        本試験の過去問を転載するものではありません。
      </p>
    </section>

    <section class="planned-features" aria-labelledby="features-title">
      <h2 id="features-title">予定している機能</h2>
      <ul>
        <li>10問・30問・50問から選べる演習</li>
        <li>4択回答と「？」による要復習マーク</li>
        <li>正答率、誤答、「？」の結果表示</li>
        <li>正誤理由、周辺知識、出典リンク付きの解説</li>
      </ul>
    </section>

    <footer class="footer">
      <p>問題・解説は公式資料を確認し、オリジナル問題として作成します。</p>
    </footer>
  </main>
`;
