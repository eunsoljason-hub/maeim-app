"use client";

import { ROADMAP_PERIODS, type RoadmapItem } from "@/lib/growth";

export function LifeRoadmap({
  value,
  onChange,
}: {
  value: RoadmapItem[];
  onChange: (next: RoadmapItem[]) => void;
}) {
  const update = (id: string, patch: Partial<RoadmapItem>) => {
    onChange(value.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const filled = value.filter((item) => item.vision.trim() || item.goal.trim()).length;

  return (
    <section className="growth-panel" aria-label="인생 로드맵">
      <header className="growth-panel-head">
        <div>
          <p className="eyebrow">Life roadmap</p>
          <h2>인생 로드맵</h2>
        </div>
        <span className="tiny">{filled} / 5 적음</span>
      </header>

      <p className="growth-lead">
        멀리서부터 지금까지 내려오면서 적어요. 10년 뒤의 장면이 이번 달의 한 줄을 바꿔요.
      </p>

      <div className="roadmap">
        {ROADMAP_PERIODS.map((period, index) => {
          const item = value.find((entry) => entry.id === period.id);
          const vision = item?.vision ?? "";
          const goal = item?.goal ?? "";
          return (
            <article key={period.id} className={`road-step step-${index}`}>
              <div className="road-rail" aria-hidden="true">
                <span className="road-dot" />
                {index < ROADMAP_PERIODS.length - 1 ? <span className="road-line" /> : null}
              </div>
              <div className="road-card">
                <div className="road-head">
                  <b>{period.label}</b>
                  <span className="tiny">{period.hint}</span>
                </div>
                <label className="road-label">
                  <span>그때의 장면</span>
                  <textarea
                    rows={3}
                    maxLength={300}
                    value={vision}
                    onChange={(event) => update(period.id, { vision: event.target.value })}
                    placeholder={
                      period.id === "month"
                        ? "이번 달 안에 내가 하고 싶은 것"
                        : `${period.label}의 하루는 어떤 모습인가요?`
                    }
                  />
                </label>
                <label className="road-label">
                  <span>그때까지의 목표 한 줄</span>
                  <input
                    value={goal}
                    maxLength={80}
                    onChange={(event) => update(period.id, { goal: event.target.value })}
                    placeholder="측정할 수 있는 한 문장"
                  />
                </label>
              </div>
            </article>
          );
        })}
      </div>

      <p className="growth-saved">적는 대로 자동 저장돼요.</p>
    </section>
  );
}
