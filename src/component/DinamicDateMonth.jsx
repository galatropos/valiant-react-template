// src/component/DinamicDateMonth.js
import useRemainingMonthTime from "../hook/useRemainingMonthTime";
import hexadecimalToRgba from "../utils/hexadecimalToRgba";

const DinamicDateMonth = ({
  itemBackground = "#000000",
  itemBackgroundAlpha = 0.35,
  valueColor = "#ffffff",
  labelColor = "#ffffff",
  gap = 8,
}) => {
  const time = useRemainingMonthTime();

  return (
    <>
      <style>{`
        .dinamicDateMonth {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: var(--dinamicDateMonthGap);
          width: 100%;
          height: 100%;
          min-width: 0;
          min-height: 0;
        }

        .dinamicDateMonthItem {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          align-items: stretch;
          width: 100%;
          height: 100%;
          min-width: 0;
          min-height: 0;
          padding: 6px;
          border-radius: 8px;
          background: var(--dinamicDateMonthItemBackground);
          box-sizing: border-box;
          overflow: hidden;
          container-type: size;
        }

        .dinamicDateMonthValueWrap {
          display: flex;
          align-items: flex-start;
          justify-content: center;
          width: 100%;
          flex: 1 1 auto;
          min-width: 0;
          min-height: 0;
          overflow: hidden;
        }

        .dinamicDateMonthLabelWrap {
          display: flex;
          align-items: flex-end;
          justify-content: center;
          width: 100%;
          flex: 0 0 auto;
          min-width: 0;
          min-height: 0;
          overflow: hidden;
        }

        .dinamicDateMonthValue {
          display: block;
          width: 100%;
          min-width: 0;
          font-size: clamp(14px, 46cqh, 56px);
          font-weight: 700;
          line-height: 0.9;
          text-align: center;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: clip;
        }

        .dinamicDateMonthLabel {
          display: block;
          width: 100%;
          min-width: 0;
          font-size: clamp(14px, 28cqh, 32px);
          font-weight: 600;
          line-height: 1;
          text-align: center;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: clip;
        }
      `}</style>

      <div
        className="dinamicDateMonth"
        style={{
          "--dinamicDateMonthGap": `${gap}px`,
          "--dinamicDateMonthItemBackground": hexadecimalToRgba(
            itemBackground,
            itemBackgroundAlpha
          ),
        }}
      >
        <div className="dinamicDateMonthItem">
          <div className="dinamicDateMonthValueWrap">
            <span
              className="dinamicDateMonthValue"
              style={{ color: valueColor }}
            >
              {time.days}
            </span>
          </div>
          <div className="dinamicDateMonthLabelWrap">
            <span
              className="dinamicDateMonthLabel"
              style={{ color: labelColor }}
            >
              Days
            </span>
          </div>
        </div>

        <div className="dinamicDateMonthItem">
          <div className="dinamicDateMonthValueWrap">
            <span
              className="dinamicDateMonthValue"
              style={{ color: valueColor }}
            >
              {time.hours}
            </span>
          </div>
          <div className="dinamicDateMonthLabelWrap">
            <span
              className="dinamicDateMonthLabel"
              style={{ color: labelColor }}
            >
              Hours
            </span>
          </div>
        </div>

        <div className="dinamicDateMonthItem">
          <div className="dinamicDateMonthValueWrap">
            <span
              className="dinamicDateMonthValue"
              style={{ color: valueColor }}
            >
              {time.minutes}
            </span>
          </div>
          <div className="dinamicDateMonthLabelWrap">
            <span
              className="dinamicDateMonthLabel"
              style={{ color: labelColor }}
            >
              Minutes
            </span>
          </div>
        </div>

        <div className="dinamicDateMonthItem">
          <div className="dinamicDateMonthValueWrap">
            <span
              className="dinamicDateMonthValue"
              style={{ color: valueColor }}
            >
              {time.seconds}
            </span>
          </div>
          <div className="dinamicDateMonthLabelWrap">
            <span
              className="dinamicDateMonthLabel"
              style={{ color: labelColor }}
            >
              Seconds
            </span>
          </div>
        </div>
      </div>
    </>
  );
};

export default DinamicDateMonth;