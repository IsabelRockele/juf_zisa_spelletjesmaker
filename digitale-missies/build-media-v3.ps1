$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech
$media = @(
 @{key='flower';source='flower-source.mp4';speed=4;words='In de tuin groeit een bloem. Eerst zit de bloem nog dicht. Langzaam gaan de blaadjes open. Een bloem heeft tijd nodig om te groeien.'},
 @{key='monarch';source='monarch.source';speed=1;words='Een vlinder rust op een plant. Zijn vleugels bewegen zachtjes. Vlinders zoeken bloemen. Daar vinden ze nectar.'},
 @{key='stream';source='stream.source';speed=1;words='Water stroomt door het bos. Het gaat over de stenen. Het water blijft maar stromen.'},
 @{key='duck';source='duck.source';speed=3;words='Deze eend zoekt eten. Met zijn poten kan hij goed zwemmen. Onder het water is ook eten te vinden.'},
 @{key='waterfall';source='waterfall.source';speed=1;words='Luister naar het water. Het komt van hoog op de rotsen. Beneden spat het uit elkaar. Het water stroomt verder.'},
 @{key='fish';source='fish.source';speed=1;words='Een vis zwemt langs de rotsen. Zijn kleine vinnen bewegen snel. Zo kan hij sturen en op zijn plek blijven.'},
 @{key='glasswing';source='glasswing.source';speed=1;words='Er bestaan veel soorten vlinders. Sommige vlinders vallen goed op. Andere vlinders zijn veel moeilijker te zien.'}
)
foreach($clip in $media){
 $wav=Join-Path $PSScriptRoot ('../.tmp-goals/'+$clip.key+'-v3.wav')
 $voice=New-Object System.Speech.Synthesis.SpeechSynthesizer
 $voice.SelectVoice('Microsoft Frank'); $voice.Rate=-2
 $voice.SetOutputToWaveFile($wav); $voice.Speak($clip.words); $voice.Dispose()
 $source=Join-Path $PSScriptRoot ('../.tmp-goals/'+$clip.source)
 $output=Join-Path $PSScriptRoot ('assets/'+$clip.key+'-v3.mp4')
 & ffmpeg -loglevel error -y -i $source -i $wav -map 0:v:0 -map 1:a:0 -vf "setpts=$($clip.speed)*(PTS-STARTPTS),scale=960:-2" -af apad -r 25 -t 18 -shortest -c:v libx264 -preset fast -crf 25 -pix_fmt yuv420p -c:a aac -b:a 96k -movflags +faststart $output
 if($LASTEXITCODE -ne 0){throw "Video mislukt: $($clip.key)"}
 Write-Output $clip.key
}
