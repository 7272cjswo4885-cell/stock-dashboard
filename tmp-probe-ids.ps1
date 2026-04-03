$ids = @(
  'SP500PE','SP500EARN','SP500EARNY','SP500PE10','SP500_P_E','SP500EY','PE','EARNINGSYIELD','SIGMA',
  'ISM','ISM_MFG','ISM_MAN_PMI','ISMMS','ISM/MAN_PMI','ISM/PMI'
)
foreach($id in $ids){
  Write-Output $id
  curl.exe -I -s "https://fred.stlouisfed.org/series/$id" | Select-String 'HTTP/1.1'
}
