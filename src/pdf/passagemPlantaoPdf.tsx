import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { PassagemPlantaoData } from '@/hooks/usePassagemPlantao';
import { ExportacaoForm } from '@/components/modals/ExportacaoPdfModal';

const styles = StyleSheet.create({
  page: { padding: 24, fontSize: 12 },
  section: { marginBottom: 12 },
  titulo: { fontSize: 16, marginBottom: 4 },
  subtitulo: { fontSize: 14, marginBottom: 4 },
  item: { marginLeft: 12, marginBottom: 2 },
});

export async function gerarPassagemPlantaoPdf(
  dados: PassagemPlantaoData,
  form: ExportacaoForm
) {
  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.titulo}>Passagem de Plantão</Text>
          <Text>Data: {format(form.dataPlantao, 'dd/MM/yyyy')}</Text>
          <Text>Turno: {form.turno}</Text>
          <Text>Enfermeiro: {form.nomeEnfermeiro}</Text>
          <Text>Médico: {form.nomeMedico}</Text>
        </View>
        {Object.entries(dados).map(([grupo, setores]) => (
          <View key={grupo} style={styles.section}>
            <Text style={styles.subtitulo}>{grupo}</Text>
            {(setores as any[]).map((s, idx) => (
              <View key={idx} style={{ marginBottom: 6 }}>
                <Text>{s.setor?.nomeSetor || 'Setor'}</Text>
                {s.blocos.map((b: any) => (
                  <View key={b.titulo} style={{ marginLeft: 6 }}>
                    <Text>{b.titulo}</Text>
                    {b.itens.length ? (
                      b.itens.map((i: string, iIdx: number) => (
                        <Text key={iIdx} style={styles.item}>{i}</Text>
                      ))
                    ) : (
                      <Text style={styles.item}>Sem dados</Text>
                    )}
                  </View>
                ))}
              </View>
            ))}
          </View>
        ))}
      </Page>
    </Document>
  );

  const blob = await pdf(doc).toBlob();
  const url = URL.createObjectURL(blob);
  window.open(url);
}

export default gerarPassagemPlantaoPdf;
