/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import { describe, expect, test } from 'vitest'

import { formatChartTime } from '@/lib/time'

import type { QuotaDataItem } from '../types'
import { buildCacheHitRateChartSpec } from './charts'

type CommonSpec = {
  type: string
  data: Array<{ id: string; values: Array<Record<string, unknown>> }>
  series: Array<{ type: string }>
  axes: Array<{ orient: string; seriesIndex?: number[] }>
  title: { visible: boolean; text?: string; subtext?: string }
}

function asSpec(data: QuotaDataItem[]): CommonSpec {
  return buildCacheHitRateChartSpec(data) as unknown as CommonSpec
}

function dataValues(
  spec: CommonSpec,
  id: string
): Array<Record<string, unknown>> {
  return spec.data.find((entry) => entry.id === id)?.values ?? []
}

describe('buildCacheHitRateChartSpec', () => {
  test('aggregates rows by hour into token bars and a rate line on dual axes', () => {
    const spec = asSpec([
      { created_at: 3600, cache_hit_tokens: 50, total_input_tokens: 100 },
      { created_at: 3660, cache_hit_tokens: 30, total_input_tokens: 100 },
      { created_at: 7200, cache_hit_tokens: 0, total_input_tokens: 0 },
      { created_at: 10800, cache_hit_tokens: 100, total_input_tokens: 200 },
    ])

    expect(spec.type).toBe('common')
    expect(spec.series.map((entry) => entry.type)).toEqual(['bar', 'line'])
    expect(spec.axes).toContainEqual(
      expect.objectContaining({ orient: 'right', seriesIndex: [1] })
    )

    const firstHour = formatChartTime(3600, 'hour')
    const volumes = dataValues(spec, 'cacheVolumes')
    expect(volumes.filter((entry) => entry.Time === firstHour)).toEqual([
      { Time: firstHour, Metric: 'Cache Hit Tokens', Value: 80 },
      { Time: firstHour, Metric: 'Total Input Tokens', Value: 200 },
    ])

    const rates = dataValues(spec, 'cacheRate')
    expect(rates.map((entry) => entry.HitRate)).toEqual([40, 50])
  })

  test('omits hours without input tokens so the rate line keeps a gap', () => {
    const spec = asSpec([
      { created_at: 3600, cache_hit_tokens: 50, total_input_tokens: 100 },
      { created_at: 7200, cache_hit_tokens: 0, total_input_tokens: 0 },
    ])

    const rates = dataValues(spec, 'cacheRate')
    expect(rates).toHaveLength(1)
    expect(rates[0].Time).toBe(formatChartTime(3600, 'hour'))

    // The zero-input hour still contributes its zero-valued volume bars.
    const volumes = dataValues(spec, 'cacheVolumes')
    expect(volumes).toHaveLength(4)
  })

  test('shows a no-data title when there are no rows', () => {
    const spec = asSpec([])
    expect(spec.title).toEqual({
      visible: true,
      text: 'Cache Hit Rate',
      subtext: 'No data available',
    })
    expect(dataValues(spec, 'cacheRate')).toHaveLength(0)
  })

  test('treats rows without recorded input totals as no data', () => {
    const spec = asSpec([
      { created_at: 3600, cache_hit_tokens: 0, total_input_tokens: 0 },
    ])
    expect(spec.title.visible).toBe(true)
    expect(dataValues(spec, 'cacheRate')).toHaveLength(0)
  })
})
