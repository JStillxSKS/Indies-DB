import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { Layout } from './components/Layout'
import { Home } from './pages/Home'
import { Maps } from './pages/Maps'
import { MapDetail } from './pages/MapDetail'
import { Upload } from './pages/Upload'
import { Login } from './pages/Login'
import { Install } from './pages/Install'
import { MyMaps } from './pages/MyMaps'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="maps" element={<Maps />} />
            <Route path="maps/:id" element={<MapDetail />} />
            <Route path="upload" element={<Upload />} />
            <Route path="my-maps" element={<MyMaps />} />
            <Route path="login" element={<Login />} />
            <Route path="install" element={<Install />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}