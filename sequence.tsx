import React, { FC, useEffect, useState } from 'react';
import { Popover } from 'antd';

const PALETTE = [
  {
    color: '#82C43C',
    interval: '0-10ms',
  },
  {
    color: '#50B5FF',
    interval: '10-50ms',
  },
  {
    color: '#A461D8',
    interval: '50-100ms',
  },
  {
    color: '#FF974A',
    interval: '100-200ms',
  },
  {
    color: '#FFC542',
    interval: '200-300ms',
  },
  {
    color: '#FC5A5A',
    interval: '>300ms',
  },
];

function getSpanTimeColor(spanTime: number) {
  const times = [0, 10, 50, 100, 200, 300];
  const index = times.findIndex((value, index) => (
    spanTime > value && index < times.length - 1 && spanTime <= times[index + 1]
  ));

  if (index < 0) {
    return PALETTE[PALETTE.length - 1].color;
  }
  return PALETTE[index].color;
}

/**
 * 指标分析任务耗时 时序图
 */

const SPAN_HEIGHT = 20;
const SPAN_CONTAINER_HEIGHT = 22;

interface ISpan {
  name: string;
  startTime: number;
  endTime: number;
}

export interface ITimelineSequence {
  spans: ISpan[];
  totalTime: number;
  onClick: (spanName: string) => void;
}

export const TimelineSequence: FC<ITimelineSequence> = (props) => {
  const [sequence, setSequence] = useState<ISpan[][]>([]);
  const [height, setHeight] = useState<number>(0);

  useEffect(() => {
    const sequence = generateSequence();
    setSequence(sequence);

    const height = SPAN_CONTAINER_HEIGHT * sequence.length;
    setHeight(height);
  }, [props.spans]);

  // 判断当前的 span 列表中是否可以插入一个新的 span
  const canInsert = (toInsertSpan: ISpan, spanList: ISpan[]) => {
    let avaliable = true;
    spanList.forEach((span) => {
      const startAcross = toInsertSpan.startTime >= span.startTime
        && toInsertSpan.startTime <= span.endTime;
      const endAcross = toInsertSpan.endTime >= span.startTime
        && toInsertSpan.endTime <= span.endTime;
      if (startAcross || endAcross) {
        avaliable = false;
        return;
      }
    });
    return avaliable;
  };

  // 将一维 span 数组生成不重叠的多维的数组
  const generateSequence = () => {
    const sequences: ISpan[][] = [];
    props.spans.forEach((span) => {
      if (span.endTime <= span.startTime) {
        return;
      }
      let index = 0;
      while (index < sequences.length) {
        if (canInsert(span, sequences[index])) {
          sequences[index].push(span);
          break;
        } else {
          index += 1;
        }
      }

      if (index >= sequences.length) {
        sequences.push([span]);
      }
    });
    return sequences;
  };

  return <div style={{
    position: 'relative',
    background: '#F3F3F4',
    height,
  }}>
    {sequence.map((lines, index) => (
      <div key={index}>
        {lines.map(span => (
          <Popover
            key={span.name}
            content={`span名: ${span.name}, 开始时间: ${span.startTime} ms, 耗时: ${span.endTime - span.startTime} ms`}
          >
            <div
              onClick={() => {
                props.onClick(span.name);
              }}
              style={{
                display: 'inline-block',
                position: 'absolute',
                background: getSpanTimeColor((span.endTime - span.startTime)),
                width: `${(span.endTime - span.startTime) / props.totalTime * 100}%`,
                height: `${SPAN_HEIGHT}px`,
                top: `${SPAN_CONTAINER_HEIGHT * index}px`,
                left: `${span.startTime / props.totalTime * 100}%`,
                color: '#FFF',
                paddingLeft: '12px',
                paddingRight: '12px',
                fontSize: '12px',
                lineHeight: `${SPAN_HEIGHT}px`,
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
              }}>
              {span.name}
            </div>
          </Popover>
        ))}
      </div>
    ))}
  </div>;
};
