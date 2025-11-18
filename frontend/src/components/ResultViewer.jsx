import React from "react";

function ResultViewer({ result }) {
  return (
    <div style={{ marginTop: "20px" }}>
      <h2>📄 요약</h2>
      <p>{result.summary}</p>

      <h2>⚠️ 위험 조항</h2>
      <ul>
        {result.riskItems.map((item) => (
          <li key={item.id} style={{ marginBottom: "10px" }}>
            <strong>조항:</strong> {item.clauseText}<br />
            <strong>위험도:</strong> {item.riskLevel}<br />
            <strong>이유:</strong> {item.reason}<br />
            <strong>대응 가이드:</strong> {item.guide}<br />
            {item.lawRefs?.map((law, idx) => (
              <div key={idx}>
                📎 <a href={law.url} target="_blank">{law.name} {law.article}</a>
              </div>
            ))}
          </li>
        ))}
      </ul>

      <h2>📝 추천 서식</h2>
      <ul>
        {result.forms.map((form, idx) => (
          <li key={idx}>
            {form.type} - {form.description} <br />
            📎 <a href={form.downloadUrl} target="_blank">다운로드</a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ResultViewer;
