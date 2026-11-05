import { Routes, Route } from 'react-router-dom'
import Home from './components/Routes/Home'
import PatientWelcome from './components/Routes/PatientWelcome'
import CareGiverWelcome from './components/Routes/CareGiverWelcome'
import SetReminders from './components/Routes/SetReminders'
import SetMemoryAlbum from './components/Routes/SetMemoryAlbum'
import ViewLocation from './components/Routes/ViewLocation'
import SeeReminder from './components/Routes/SeeReminder'
import SeeMemoryAlbum from './components/Routes/SeeMemoryAlbum'
import SeeMemoryGame from './components/Routes/seeMemoryGame'
import SetRecipes from './components/Routes/SetRecipes'
import SeeRecipe from './components/Routes/SeeRecipe'
import SeeWeather from './components/Routes/SeeWeather'
import CareNotes from './components/Routes/CareNotes'
import TodayPlan from './components/Routes/TodayPlan'
import PatientProfile from './components/Routes/PatientProfile'
import CareProfile from './components/Routes/CareProfile'
import Account from './components/Routes/Account'
import NotFound from './components/Routes/NotFound'
import RequireAuth from './components/RequireAuth'

function App() {
  return (
    <Routes>
      <Route path='/' element={<Home />} />
      <Route path='/patient' element={<RequireAuth role="patient"><PatientWelcome /></RequireAuth>} />
      <Route path='/caregiver' element={<RequireAuth role="caregiver"><CareGiverWelcome /></RequireAuth>} />
      <Route path='/account' element={<RequireAuth role={['patient', 'caregiver']}><Account /></RequireAuth>} />

      <Route path='/setReminders' element={<RequireAuth role="caregiver"><SetReminders /></RequireAuth>} />
      <Route path='/setMemoryAlbum' element={<RequireAuth role="caregiver"><SetMemoryAlbum /></RequireAuth>} />
      <Route path='/setRoutines' element={<RequireAuth role="caregiver"><SetRecipes /></RequireAuth>} />
      <Route path='/viewLocation' element={<RequireAuth role="caregiver"><ViewLocation /></RequireAuth>} />
      <Route path='/manageCareNotes' element={<RequireAuth role="caregiver"><CareNotes canManage /></RequireAuth>} />
      <Route path='/careProfile' element={<RequireAuth role="caregiver"><CareProfile /></RequireAuth>} />

      <Route path='/profile' element={<RequireAuth role="patient"><PatientProfile /></RequireAuth>} />
      <Route path='/seeReminder' element={<RequireAuth role="patient"><SeeReminder /></RequireAuth>} />
      <Route path='/seeMemoryAlbum' element={<RequireAuth role="patient"><SeeMemoryAlbum /></RequireAuth>} />
      <Route path='/seeMemoryGame' element={<RequireAuth role="patient"><SeeMemoryGame /></RequireAuth>} />
      <Route path='/seeRoutines' element={<RequireAuth role="patient"><SeeRecipe /></RequireAuth>} />
      <Route path='/weather' element={<RequireAuth role="patient"><SeeWeather /></RequireAuth>} />
      <Route path='/SeeWeather' element={<RequireAuth role="patient"><SeeWeather /></RequireAuth>} />
      <Route path='/today' element={<RequireAuth role="patient"><TodayPlan /></RequireAuth>} />
      <Route path='/careNotes' element={<RequireAuth role="patient"><CareNotes /></RequireAuth>} />

      <Route path='*' element={<NotFound />} />
    </Routes>
  )
}

export default App
