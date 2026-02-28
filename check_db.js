import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zcoezrnswnjzmsvozjc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpjb2V6cm5zd25qc3ptc3ZvempjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0Mzg5OTMsImV4cCI6MjA4NjAxNDk5M30.rNO7-ZrqlWFHORrg8pJBPysvvwj_jV6Vf8dpakeNPeE';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function check() {
    const { data, error } = await supabase
        .from('clientes')
        .select('usuario, estado_pipeline, nombre')
        .eq('usuario', 'misaelrobles0404@gmail.com');

    if (error) {
        console.error('Error fetching:', error);
        return;
    }

    console.log(`\nFound ${data.length} records for Misael:`);

    let capturados = 0;
    let posteados = 0;
    let otros = 0;

    data.forEach(c => {
        if (c.estado_pipeline === 'capturado') capturados++;
        else if (c.estado_pipeline === 'posteado') posteados++;
        else otros++;
    });

    console.log('Capturados:', capturados);
    console.log('Posteados:', posteados);
    console.log('Otros (prospectos/pendientes):', otros);

    console.log('\nOthers overview:');
    const { data: allData } = await supabase.from('clientes').select('usuario, estado_pipeline');
    console.log(`Total across ALL users (anon key): ${allData?.length}`);
}

check();
