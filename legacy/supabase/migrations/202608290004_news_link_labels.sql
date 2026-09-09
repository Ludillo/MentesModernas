update public.site_content
set value=jsonb_set(value,'{articles}',(
 select jsonb_agg(article || jsonb_build_object('link_label','Leer más'))
 from jsonb_array_elements(value->'articles') article
)),updated_at=now()
where key='news';
