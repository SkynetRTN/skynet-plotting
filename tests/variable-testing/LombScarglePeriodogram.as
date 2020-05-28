package edu.unc.skynet.common
{
	public class LombScarglePeriodogram
	{
		public function LombScarglePeriodogram()
		{
		}
		
		public static function toFrequencySpace(ts:Array,ys:Array,fs:Array):Array {
			var result:Array = new Array(fs.length);
			if( ts.length != ys.length ) {
				throw "Length of times must equal length of values";
			}
			
			var testFrequencies:Array = fs
			
			var nyquist:Number = 1.0/(2.0*( ( ArrayArith.max(ts) - ArrayArith.min(ts) ) / ts.length ) )
			var hResidual:Array = ArrayArith.subtract(ys,ArrayArith.mean(ys));
			var spectralPowerDensity:Array = new Array(testFrequencies.length);
			for( var i:int=0; i<testFrequencies.length; i++) {
				var omega:Number = 2.0*Math.PI*testFrequencies[i];
				var twoOmegaT:Array = ArrayArith.multiply(2.0*omega,ts);
				var tau:Number = Math.atan2( ArrayArith.sum(ArrayArith.sin(twoOmegaT)), ArrayArith.sum(ArrayArith.cos(twoOmegaT))) / (2.0*omega)
				var omegaTMinusTau:Array = ArrayArith.multiply(omega,ArrayArith.subtract(ts,tau));
				spectralPowerDensity[i] = ( Math.pow(ArrayArith.sum(ArrayArith.multiply(hResidual,ArrayArith.cos(omegaTMinusTau))),2.0) ) /
										  ( ArrayArith.sum(ArrayArith.pow(ArrayArith.cos(omegaTMinusTau),2.0)))  +
										  ( Math.pow(ArrayArith.sum(ArrayArith.multiply(hResidual,ArrayArith.sin(omegaTMinusTau))),2.0) ) /
										  ( ArrayArith.sum(ArrayArith.pow(ArrayArith.sin(omegaTMinusTau),2.0)));
				
			}
			
			spectralPowerDensity = ArrayArith.divide(spectralPowerDensity,2.0*ArrayArith.vari(ys))
			return spectralPowerDensity;
		}
	}
}