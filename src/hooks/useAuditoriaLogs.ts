import { useEffect, useMemo, useState } from 'react'
import {
  addDoc,
  collection,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  writeBatch,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useUsuarios } from './useUsuarios'
import { useAuth } from './useAuth'
import { toast } from '@/hooks/use-toast'
import { useCache } from '@/contexts/CacheContext'

export interface Log {
  id: string
  usuario: string
  usuarioId: string | null
  pagina: string
  acao: string
  timestamp: Timestamp
}

export interface FiltrosLogs {
  texto: string
  usuarioId: string
  dataInicio: Date | null
  dataFim: Date | null
  pagina: string
}

export const useAuditoriaLogs = (filtros: FiltrosLogs) => {
  const [todosLogs, setTodosLogs] = useState<Log[]>([])
  const [loading, setLoading] = useState(true)
  const { usuarios } = useUsuarios()
  const { currentUser } = useAuth()
  const { getCachedData, setCachedData } = useCache()

  const mapaUsuarios = useMemo(() => {
    const mapa = new Map<string, string>()
    usuarios.forEach(u => {
      if (u.uid) mapa.set(u.uid, u.nomeCompleto)
    })
    return mapa
  }, [usuarios])

  useEffect(() => {
    const cached = getCachedData<Log[]>('auditoriaLogs')
    if (cached) {
      setTodosLogs(cached)
      setLoading(false)
    }

    const q = query(
      collection(db, 'auditoriaRegulaFacil'),
      orderBy('timestamp', 'desc')
    )
    const unsubscribe = onSnapshot(q, snapshot => {
      const logsData: Log[] = snapshot.docs.map(doc => {
        const data = doc.data() as any
        const uid = data.uid || data.usuarioId || null
        const nomeUsuario = uid
          ? mapaUsuarios.get(uid) || uid
          : data.usuario || 'Sistema'
        return {
          id: doc.id,
          usuario: nomeUsuario,
          usuarioId: uid,
          pagina: data.pagina || data.detalhes || '',
          acao: data.acao || data.mensagem || '',
          timestamp: data.timestamp,
        }
      })
      setTodosLogs(logsData)
      setCachedData('auditoriaLogs', logsData)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [mapaUsuarios, getCachedData, setCachedData])

  const logs = useMemo(() => {
    return todosLogs.filter(log => {
      if (!log.timestamp) {
        return false
      }

      const dataLog = log.timestamp.toDate()
      if (
        filtros.texto &&
        !log.acao.toLowerCase().includes(filtros.texto.toLowerCase()) &&
        !log.pagina.toLowerCase().includes(filtros.texto.toLowerCase()) &&
        !log.usuario.toLowerCase().includes(filtros.texto.toLowerCase())
      ) {
        return false
      }
      if (filtros.usuarioId && filtros.usuarioId !== 'todos' && log.usuarioId !== filtros.usuarioId) return false
      if (filtros.dataInicio && dataLog < filtros.dataInicio) return false
      if (filtros.dataFim && dataLog > filtros.dataFim) return false
      if (filtros.pagina && log.pagina !== filtros.pagina) return false
      return true
    })
  }, [todosLogs, filtros])

  const limparTodosOsLogs = async () => {
    setLoading(true)
    try {
      const q = query(collection(db, 'auditoriaRegulaFacil'))
      const snapshot = await getDocs(q)
      const batch = writeBatch(db)
      snapshot.docs.forEach(doc => batch.delete(doc.ref))
      await batch.commit()

      await addDoc(collection(db, 'auditoriaRegulaFacil'), {
        uid: currentUser?.uid || null,
        pagina: 'Auditoria',
        acao: 'Todos os logs foram limpos',
        timestamp: serverTimestamp(),
      })
      toast({ title: 'Logs limpos com sucesso.' })
    } catch (error) {
      console.error('Erro ao limpar logs:', error)
      toast({
        title: 'Erro ao limpar logs',
        description: 'Não foi possível limpar os registros.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return { logs, loading, limparTodosOsLogs }
}

