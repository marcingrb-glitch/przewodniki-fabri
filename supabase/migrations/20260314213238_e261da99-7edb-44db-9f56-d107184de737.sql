UPDATE sku_segments 
SET regex_pattern = '^B(\d+[SsWw]?)([A-D])?$'
WHERE segment_name = 'side';